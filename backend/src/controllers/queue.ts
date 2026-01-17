import { Request, Response } from 'express';
import { VarianceManager } from '../services/variance_manager';

export class QueueController {
    private varianceManager: VarianceManager;
    private database: any;

    constructor(database: any) {
        this.varianceManager = new VarianceManager();
        this.database = database;
    }

    public async updateQueue(req: Request, res: Response): Promise<void> {
        const { doctorId, endTime } = req.body;

        // Logic to update the queue based on the doctor's end time
        try {
            // Update the queue in the database
            await this.database.run('UPDATE queue SET estimated_wait = ? WHERE doctor_id = ?', [endTime, doctorId]);
            res.status(200).json({ message: 'Queue updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update queue' });
        }
    }

    public async getQueueStatus(req: Request, res: Response): Promise<void> {
        const { doctorId } = req.params;

        // Logic to retrieve the current status of the queue
        try {
            const queueStatus = await this.database.getQueueStatus(doctorId);
            res.status(200).json(queueStatus);
        } catch (error) {
            res.status(500).json({ error: 'Failed to retrieve queue status' });
        }
    }

    public async advanceStage(req: Request, res: Response): Promise<void> {
        const { queueId, newStage } = req.body;
        try {
            await this.database.advanceStage(queueId, newStage);
            const io = (global as any).io;
            io.to(`doctor-${req.body.doctorId}`).emit('queue-update', { type: 'stage-advanced', queueId, newStage });
            res.status(200).json({ message: 'Stage advanced' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to advance stage' });
        }
    }

    public async getMultiStageStatus(req: Request, res: Response): Promise<void> {
        const { doctorId } = req.params;
        try {
            const queue = await this.database.getQueueStatus(doctorId);
            const durations = await this.database.getStageDurations(doctorId);
            res.status(200).json({ queue, durations });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get multi-stage status' });
        }
    }

    public async updateSlotTime(req: Request, res: Response): Promise<void> {
        const { doctorId } = req.params;
        const { patientId, actualDuration } = req.body;
        try {
            await this.database.saveActualTime(doctorId, patientId, actualDuration);
            res.status(200).json({ message: 'Slot time updated' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    private async recalculateQueueWaitTimes(doctorId: string): Promise<void> {
        // Logic to update wait times for patients in queue based on actual durations
        const queue = await this.database.getQueueStatus(doctorId);
        let cumulativeWait = 0;
        for (const patient of queue) {
            patient.estimatedWait = cumulativeWait;
            cumulativeWait += patient.estimatedDuration || 10; // Default 10min if no estimate
        }
        await this.database.updateWaitTimes(doctorId, queue);
    }
}

export default QueueController;