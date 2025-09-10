// YOLOv8 Crowd Detection Service
export * from './fineTunedYolo11Service';
import { fineTunedYolo8CrowdService } from './fineTunedYolo11Service';

// Export the Fine-tuned YOLOv8 service as the main service
export const yolo8CrowdService = fineTunedYolo8CrowdService;
export const yolo11CrowdService = fineTunedYolo8CrowdService; // Backward compatibility
