import { VarianceManager } from '../services/variance_manager';
import alertService from '../services/alerts';
import { spawn } from 'child_process';
import path from 'path';

class BookingController {
    private varianceManager: VarianceManager;

    constructor(private database: any) {
        this.varianceManager = new VarianceManager([]);
    }

    async checkSlotAndPredict(doctorId: string, slotTime: Date) {
        const availableSlots = await this.getAvailableSlots(doctorId);
        const slotTimeMs = slotTime.getTime();
        
        // Convert string slots to Date objects for comparison
        const isSlotAvailable = availableSlots.some((slot: string | Date) => {
            const slotDate = typeof slot === 'string' ? new Date(slot) : slot;
            return slotDate.getTime() === slotTimeMs;
        });
        
        if (!isSlotAvailable) {
            return { available: false, prediction: null, variance: null, tail_risk: null, risk: null };
        }

        // Get current queue length and recent data for prediction
        const queueLength = await this.database.getQueueLength(doctorId);
        const recentActualTimes = await this.database.getRecentActualTimes(doctorId);

        // Get additional data
        const doctorDetails = await this.database.getDoctorDetails(doctorId);
        const now = new Date();
        
        // Handle missing external factors gracefully
        let externalFactors = { hospital_occupancy: 0.5, traffic_level: 0.5 };
        try {
            const factors = await this.database.getExternalFactors(now.toISOString().split('T')[0]);
            if (factors) externalFactors = factors;
        } catch (e) {
            // Use defaults
        }
        
        // For patient, assume patientId is available (e.g., from session); placeholder for now
        const patientDetails = { age: 40, no_show_rate: 0.1 }; // Placeholder

        // Get stage-specific data (adapted for multi-stage queues)
        const total_queue_length = queueLength;
        const patients_at_current_stage = Math.floor(queueLength * 0.6); // Placeholder: assume 60% at consultation
        const staff_at_current_stage = 2; // Placeholder: assume 2 staff at consultation

        // Call ML prediction
        const mlResult = await this.getMLPrediction(total_queue_length, patients_at_current_stage, staff_at_current_stage, externalFactors.hospital_occupancy, patientDetails.age, externalFactors.traffic_level, doctorDetails.experience_years, slotTime.toISOString());
        
        // Alert service calls - non-blocking
        try {
            await alertService.alertHighWait(doctorId, mlResult.mean);
            if (mlResult.mean > 45) {
                await this.database.detectAnomaly(doctorId, `Predicted wait ${mlResult.mean} min`, 'high');
                await alertService.alertAnomaly(doctorId, `High predicted wait: ${mlResult.mean} min`);
            }
        } catch (e) {
            console.log('Alert service error (non-critical):', e);
        }
        
        const risk = mlResult.mean > 0 ? (mlResult.variance / mlResult.mean) * 100 : 0; // Risk as percentage
        const std_dev = Math.sqrt(mlResult.variance);
        const lower_bound = Math.max(0, mlResult.mean - 1.96 * std_dev);
        const upper_bound = mlResult.mean + 1.96 * std_dev;
        const expected_range = `${lower_bound.toFixed(1)} - ${upper_bound.toFixed(1)} minutes`;
        
        // Calculate recommended arrival time
        const buffer_time = 5; // 5 minute buffer for uncertainty
        const recommended_arrival_minutes = mlResult.mean + buffer_time;
        const recommended_arrival = new Date(slotTime.getTime() - recommended_arrival_minutes * 60000);
        
        // What if they arrive exactly at slot time
        const on_time_wait = Math.max(0, mlResult.mean - buffer_time); // Assuming some processing time
        
        return { 
            available: true, 
            prediction: mlResult.mean, 
            variance: mlResult.variance, 
            tail_risk: mlResult.tail_risk, 
            risk, 
            expected_range,
            recommended_arrival: recommended_arrival.toISOString(),
            recommended_arrival_minutes,
            on_time_wait: on_time_wait.toFixed(1)
        };
    }

    async bookSlot(doctorId: string, patientId: string, slotTime: Date) {
        const check = await this.checkSlotAndPredict(doctorId, slotTime);
        if (!check.available) {
            return { success: false, message: 'Slot is not available.' };
        }

        // Logic to book the slot for the patient
        await this.database.bookSlot(doctorId, patientId, slotTime);
        // Add to queue
        await this.database.addToQueue(doctorId, patientId);

        // Send portal notification
        const doctorDetails = await this.database.getDoctorDetails(doctorId);
        await alertService.notifyPatientBooking(patientId, doctorDetails.name, slotTime, check.prediction);

        return { success: true, message: 'Slot booked successfully.', prediction: check.prediction, variance: check.variance };
    }

    async getAvailableSlots(doctorId: string) {
        // Logic to retrieve available slots for the doctor
        return await this.database.getAvailableSlots(doctorId);
    }

    private async getMLPrediction(total_queue_length: number, patients_at_current_stage: number, staff_at_current_stage: number, hospital_occupancy: number, patient_age: number, traffic_level: number, doctor_experience: number, slot_time: string): Promise<{mean: number, variance: number, tail_risk: number}> {
        // Call Python ML script
        const pythonProcess = spawn('python', [
            path.join(__dirname, '../../../ml/scripts/predict.py'),
            total_queue_length.toString(),
            patients_at_current_stage.toString(),
            staff_at_current_stage.toString(),
            hospital_occupancy.toString(),
            patient_age.toString(),
            traffic_level.toString(),
            doctor_experience.toString(),
            slot_time
        ]);

        return new Promise((resolve) => {
            let data = '';
            let errorData = '';
            
            pythonProcess.stdout.on('data', (chunk) => data += chunk);
            pythonProcess.stderr.on('data', (chunk) => errorData += chunk);
            
            pythonProcess.on('error', () => {
                // Python not available or script error - use fallback
                console.log('ML prediction unavailable, using fallback estimation');
                resolve(this.getFallbackPrediction(total_queue_length));
            });
            
            pythonProcess.on('close', (code) => {
                if (code === 0 && data.trim()) {
                    try {
                        const result = JSON.parse(data.trim());
                        resolve(result);
                    } catch (e) {
                        console.log('Failed to parse ML output, using fallback');
                        resolve(this.getFallbackPrediction(total_queue_length));
                    }
                } else {
                    console.log('ML script failed, using fallback estimation');
                    resolve(this.getFallbackPrediction(total_queue_length));
                }
            });
        });
    }

    // Fallback prediction when ML service is unavailable
    private getFallbackPrediction(queueLength: number): { mean: number; variance: number; tail_risk: number } {
        // Realistic wait time estimation based on queue length
        // Empty queue: ~5 min (just check-in time)
        // Each patient adds ~8-12 minutes
        
        if (queueLength === 0) {
            return {
                mean: 5,
                variance: 4, // Low variance for empty queue
                tail_risk: 0.05
            };
        }
        
        const baseWait = 5; // Minimum wait for check-in
        const avgTimePerPatient = 10; // Average consultation time
        const mean = baseWait + (queueLength * avgTimePerPatient);
        
        // Variance increases with queue length but stays reasonable
        const stdDev = 3 + (queueLength * 2); // ~3 min base + 2 min per patient
        const variance = Math.pow(stdDev, 2);
        
        // Tail risk: probability of waiting more than 30 min
        const threshold = 30;
        const zScore = (threshold - mean) / stdDev;
        const tail_risk = zScore < 0 ? 0.5 + Math.abs(zScore) * 0.15 : Math.max(0.05, 0.5 - zScore * 0.15);
        
        return {
            mean: Math.round(mean),
            variance: Math.round(variance),
            tail_risk: Math.min(0.95, Math.max(0.05, Math.round(tail_risk * 100) / 100))
        };
    }
}

export default BookingController;