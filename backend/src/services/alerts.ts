import * as database from '../utils/database';

class AlertService {
    async createPortalAlert(userId: string, type: 'high_wait' | 'anomaly' | 'info', title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium') {
        await database.run(
            'INSERT INTO notifications (user_id, type, title, message, priority, created_at, read_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, type, title, message, priority, new Date().toISOString(), 'unread']
        );
    }

    async alertHighWait(doctorId: string, predictedWait: number) {
        if (predictedWait > 30) {
            // Alert doctor
            await this.createPortalAlert(
                doctorId,
                'high_wait',
                'High Wait Time Alert',
                `Predicted wait time: ${predictedWait.toFixed(1)} minutes. Consider adjusting schedule.`,
                'high'
            );

            // Alert admin/reception
            const admins = await database.query('SELECT id FROM users WHERE role = "admin" OR role = "receptionist"');
            for (const admin of admins) {
                await this.createPortalAlert(
                    admin.id,
                    'high_wait',
                    'System Alert: High Wait Time',
                    `Doctor ${doctorId} has predicted wait of ${predictedWait.toFixed(1)} minutes`,
                    'medium'
                );
            }
        }
    }

    async alertAnomaly(doctorId: string, description: string) {
        // Alert doctor
        await this.createPortalAlert(
            doctorId,
            'anomaly',
            'Queue Anomaly Detected',
            description,
            'high'
        );

        // Alert admins
        const admins = await database.query('SELECT id FROM users WHERE role = "admin"');
        for (const admin of admins) {
            await this.createPortalAlert(
                admin.id,
                'anomaly',
                'System Alert: Queue Anomaly',
                `Doctor ${doctorId}: ${description}`,
                'high'
            );
        }
    }

    async notifyPatientBooking(patientId: string, doctorName: string, slotTime: string, predictedWait: number) {
        await this.createPortalAlert(
            patientId,
            'info',
            'Appointment Confirmed',
            `Your appointment with Dr. ${doctorName} at ${new Date(slotTime).toLocaleString()} is confirmed. Expected wait: ${predictedWait.toFixed(1)} minutes.`,
            'low'
        );
    }
}

export default new AlertService();