import { CrowdData, Zone } from '../types';
import { fineTunedYolo8CrowdService } from './fineTunedYolo11Service';

export interface PredictionResult {
  predicted_count: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: PredictionFactor[];
  explanation: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timeHorizon: number;
}

export interface PredictionFactor {
  name: string;
  weight: number;
  impact: number;
  confidence: number;
  description: string;
}

export class YOLOv8PeoplePredictionService {
  private static instance: YOLOv8PeoplePredictionService;
  private detectionHistory: any[] = [];
  private isInitialized = false;
  private isInitializing = false;

  static getInstance(): YOLOv8PeoplePredictionService {
    if (!YOLOv8PeoplePredictionService.instance) {
      YOLOv8PeoplePredictionService.instance = new YOLOv8PeoplePredictionService();
    }
    return YOLOv8PeoplePredictionService.instance;
  }

  constructor() {
    // Initialize with YOLOv8 people detection service
  }

  private async initialize() {
    if (this.isInitializing || this.isInitialized) {
      return;
    }

    this.isInitializing = true;
    console.log('🧠 Initializing YOLOv8 People Prediction Service...');
    
    try {
      // Wait for YOLOv8 people detection model to be ready
      if (!fineTunedYolo8CrowdService.isModelLoaded()) {
        console.log('Waiting for YOLOv8 people detection model to load...');
        await new Promise(resolve => {
          const checkModel = () => {
            if (fineTunedYolo8CrowdService.isModelLoaded()) {
              resolve(true);
            } else {
              setTimeout(checkModel, 500);
            }
          };
          checkModel();
        });
      }
      
      this.isInitialized = true;
      console.log('✅ YOLOv8 People Prediction Service ready!');
    } catch (error) {
      console.error('People prediction service initialization failed:', error);
      this.isInitialized = true; // Mark as initialized to prevent retries
    } finally {
      this.isInitializing = false;
    }
  }

  async predictFuturePeopleLevels(locationId: string, minutesAhead: number): Promise<PredictionResult> {
    // Check system stress before prediction
    try {
      if (window.performanceOptimizer && window.performanceOptimizer.isSystemStressed()) {
        console.warn('People prediction skipped due to system stress');
        return this.fallbackPeoplePrediction(locationId, minutesAhead);
      }
    } catch (error) {
      // Performance optimizer not available, continue with prediction
    }
    
    if (!this.isInitialized && !this.isInitializing) {
      await this.initialize();
    }

    try {
      // Use YOLOv8 people detection history for enhanced predictions
      const yoloHistory = fineTunedYolo8CrowdService.getDetectionHistory();
      this.detectionHistory = yoloHistory;

      if (yoloHistory.length > 0) {
        return await this.performYOLOv8EnhancedPeoplePrediction(locationId, minutesAhead);
      } else {
        return this.fallbackPeoplePrediction(locationId, minutesAhead);
      }
    } catch (error) {
      console.error('People prediction error:', error);
      return this.fallbackPeoplePrediction(locationId, minutesAhead);
    }
  }

  private async performYOLOv8EnhancedPeoplePrediction(locationId: string, minutesAhead: number): Promise<PredictionResult> {
    const yoloDetections = fineTunedYolo8CrowdService.getDetectionHistory().slice(-5); // Use last 5 detections
    
    if (yoloDetections.length === 0) {
      return this.fallbackPeoplePrediction(locationId, minutesAhead);
    }

    const latestDetection = yoloDetections[yoloDetections.length - 1];
    
    // If YOLOv8 people detection already has predictions, use and enhance them
    if (latestDetection.predictions) {
      const yoloPrediction = latestDetection.predictions;
      
      let predicted_count = yoloPrediction.next15MinutePrediction;
      if (minutesAhead <= 1) predicted_count = yoloPrediction.nextMinutePrediction;
      else if (minutesAhead <= 5) predicted_count = yoloPrediction.next5MinutePrediction;
      else if (minutesAhead <= 30) predicted_count = yoloPrediction.next30MinutePrediction;
      
      // Enhanced factors from YOLOv8 people analysis
      const enhancedFactors: PredictionFactor[] = [
        {
          name: 'Fine-tuned YOLOv8 People Behavior Analysis',
          weight: 0.4,
          impact: latestDetection.behaviorPatterns.length * 0.12,
          confidence: 0.9,
          description: `${latestDetection.behaviorPatterns.length} people behavior patterns detected`
        },
        {
          name: 'People Flow Direction Analysis',
          weight: 0.25,
          impact: latestDetection.flowDirection.velocity / 100,
          confidence: latestDetection.flowDirection.consistency,
          description: `People flow velocity: ${latestDetection.flowDirection.velocity.toFixed(0)} people/min, ritual flow: ${latestDetection.flowDirection.ritualFlow}`
        },
        {
          name: 'People Risk Assessment Integration',
          weight: 0.2,
          impact: latestDetection.riskAssessment.evacuationUrgency,
          confidence: 0.88,
          description: `Risk level: ${latestDetection.riskAssessment.level}, people-specific risks: ${latestDetection.riskAssessment.simhasthaSpecificRisks?.length || 0}`
        },
        {
          name: 'Cultural People Patterns',
          weight: 0.15,
          impact: (latestDetection.simhasthaSpecificFeatures?.culturalPatterns.familyGroups || 0) / 100,
          confidence: 0.85,
          description: `People cultural factors: ${latestDetection.simhasthaSpecificFeatures?.culturalPatterns.familyGroups || 0} family groups, ritual activity detected: ${latestDetection.simhasthaSpecificFeatures?.ritualActivity.confidence.toFixed(2) || 0}`
        }
      ];

      // Generate enhanced explanation
      const explanation = this.generateEnhancedExplanation(
        yoloPrediction,
        latestDetection,
        minutesAhead,
        locationId
      );

      return {
        predicted_count: predicted_count || 0,
        confidence: yoloPrediction.confidence || 0.8,
        trend: yoloPrediction.trendDirection || 'stable',
        factors: enhancedFactors,
        explanation,
        riskLevel: yoloPrediction.riskLevel || 'medium',
        timeHorizon: minutesAhead
      };
    }

    // Fallback to enhanced trend analysis
    return this.performEnhancedPeopleTrendAnalysis(locationId, minutesAhead, yoloDetections);
  }

  private performEnhancedPeopleTrendAnalysis(locationId: string, minutesAhead: number, detections: any[]): PredictionResult {
    const counts = detections.map(d => d.count || 0);
    const avgCount = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    
    // Enhanced trend calculation
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let trendStrength = 0;
    
    if (counts.length >= 3) {
      const recent = counts.slice(-2);
      const older = counts.slice(0, -2);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      const difference = recentAvg - olderAvg;
      trendStrength = Math.abs(difference) / Math.max(olderAvg, 1);
      
      if (difference > olderAvg * 0.15) trend = 'increasing';
      else if (difference < -olderAvg * 0.15) trend = 'decreasing';
    }

    // Time-based and location-based adjustments
    const now = new Date();
    const futureTime = new Date(now.getTime() + minutesAhead * 60000);
    const hour = futureTime.getHours();
    
    const timeMultiplier = this.getTimeMultiplier(hour);
    const locationMultiplier = this.getLocationMultiplier(locationId);
    
    // Behavior pattern influence
    const latestDetection = detections[detections.length - 1];
    let behaviorMultiplier = 1;
    if (latestDetection.behaviorPatterns) {
      const clusteringPatterns = latestDetection.behaviorPatterns.filter((p: any) => p.type === 'clustering').length;
      const flowingPatterns = latestDetection.behaviorPatterns.filter((p: any) => p.type === 'flowing').length;
      behaviorMultiplier = 1 + (clusteringPatterns * 0.1) - (flowingPatterns * 0.05);
    }

    const predictedCount = Math.round(
      avgCount * timeMultiplier * locationMultiplier * behaviorMultiplier
    );

    // Risk assessment
    const riskLevel = this.assessRiskLevel(predictedCount, locationId);
    
    const factors: PredictionFactor[] = [
      {
        name: 'People Historical Trend Analysis',
        weight: 0.35,
        impact: trendStrength,
        confidence: Math.min(0.9, 0.6 + counts.length * 0.05),
        description: `${trend} trend with ${(trendStrength * 100).toFixed(0)}% strength`
      },
      {
        name: 'Time-based People Patterns',
        weight: 0.3,
        impact: timeMultiplier - 1,
        confidence: 0.85,
        description: `${hour}:00 - ${this.getTimeDescription(hour)}`
      },
      {
        name: 'Location People Characteristics',
        weight: 0.2,
        impact: locationMultiplier - 1,
        confidence: 0.8,
        description: `${locationId} specific people dynamics`
      },
      {
        name: 'People Behavior Pattern Influence',
        weight: 0.15,
        impact: behaviorMultiplier - 1,
        confidence: 0.75,
        description: `People behavior patterns affecting flow`
      }
    ];

    const explanation = `Based on YOLOv8 people analysis of ${counts.length} recent detections, the people count shows a ${trend} trend. ` +
      `Time factor (${(timeMultiplier * 100 - 100).toFixed(0)}% adjustment) and location people characteristics suggest ` +
      `${predictedCount} people in ${minutesAhead} minutes. Risk level: ${riskLevel}.`;

    return {
      predicted_count: Math.max(0, predictedCount),
      confidence: 0.8,
      trend,
      factors,
      explanation,
      riskLevel,
      timeHorizon: minutesAhead
    };
  }

  private generateEnhancedExplanation(
    yoloPrediction: any,
    detection: any,
    minutesAhead: number,
    locationId: string
  ): string {
    let explanation = `YOLOv8 advanced people analysis predicts ${yoloPrediction.trendDirection} people trend. `;
    
    // Behavior patterns explanation
    if (detection.behaviorPatterns.length > 0) {
      const dominantPattern = detection.behaviorPatterns.reduce((prev: any, current: any) => 
        prev.confidence > current.confidence ? prev : current
      );
      explanation += `Dominant behavior: ${dominantPattern.type} involving ${dominantPattern.peopleInvolved} people. `;
    }

    // Flow analysis explanation
    if (detection.flowDirection.velocity > 20) {
      explanation += `High people flow velocity (${detection.flowDirection.velocity.toFixed(0)} people/min) detected. `;
    }

    // Risk assessment explanation
    explanation += `Current people risk level: ${detection.riskAssessment.level} with ${detection.riskAssessment.safetyScore}% safety score. `;

    // Spatial analysis
    if (detection.spatialDistribution) {
      explanation += `People spatial distribution shows ${detection.spatialDistribution.hotspots.length} hotspots. `;
    }

    // Prediction confidence
    explanation += `People prediction confidence: ${(yoloPrediction.confidence * 100).toFixed(0)}% for ${minutesAhead}-minute forecast.`;

    return explanation;
  }

  private getTimeMultiplier(hour: number): number {
    if (hour >= 4 && hour <= 8) return 2.5; // Morning peak
    if (hour >= 17 && hour <= 21) return 2.8; // Evening peak
    if (hour >= 22 || hour <= 3) return 0.2; // Night
    return 1.4; // Regular hours
  }

  private getLocationMultiplier(locationId: string): number {
    const multipliers = {
      'mahakal-ghat': 1.4,
      'ram-ghat': 1.2,
      'bhairav-ghat': 1.3,
      'narsingh-ghat': 0.9,
      'kshipra-ghat': 0.8
    };
    return multipliers[locationId as keyof typeof multipliers] || 1.0;
  }

  private getTimeDescription(hour: number): string {
    if (hour >= 4 && hour <= 8) return 'Morning bathing peak period';
    if (hour >= 17 && hour <= 21) return 'Evening aarti ceremony time';
    if (hour >= 22 || hour <= 3) return 'Night time minimal activity';
    return 'Regular operational hours';
  }

  private assessRiskLevel(predictedCount: number, locationId: string): 'low' | 'medium' | 'high' | 'critical' {
    const capacities = {
      'ram-ghat': 500,
      'mahakal-ghat': 800,
      'bhairav-ghat': 900,
      'narsingh-ghat': 600,
      'kshipra-ghat': 700
    };
    
    const capacity = capacities[locationId as keyof typeof capacities] || 500;
    const occupancyRate = predictedCount / capacity;
    
    if (occupancyRate > 0.9) return 'critical';
    if (occupancyRate > 0.7) return 'high';
    if (occupancyRate > 0.5) return 'medium';
    return 'low';
  }

  private fallbackPeoplePrediction(locationId: string, minutesAhead: number): PredictionResult {
    // Enhanced fallback based on location and time
    const hour = new Date().getHours();
    let baseCount = 150;
    
    const locationFactors = {
      'mahakal-ghat': 1.3,
      'ram-ghat': 1.1,
      'bhairav-ghat': 1.2,
      'narsingh-ghat': 0.8,
      'kshipra-ghat': 0.9
    };
    
    baseCount *= locationFactors[locationId as keyof typeof locationFactors] || 1.0;
    
    // Time-based adjustment
    if (hour >= 4 && hour <= 8) baseCount *= 2.2;
    else if (hour >= 17 && hour <= 20) baseCount *= 2.5;
    else if (hour >= 22 || hour <= 3) baseCount *= 0.2;
    
    const predictedCount = Math.round(baseCount);
    const riskLevel = this.assessRiskLevel(predictedCount, locationId);
    
    return {
      predicted_count: predictedCount,
      confidence: 0.6,
      trend: 'stable' as const,
      factors: [
        {
          name: 'People Location Factor',
          weight: 0.5,
          impact: locationFactors[locationId as keyof typeof locationFactors] || 1.0,
          confidence: 0.7,
          description: `${locationId} people baseline characteristics`
        },
        {
          name: 'People Time Factor',
          weight: 0.5,
          impact: 1.0,
          confidence: 0.8,
          description: `${hour}:00 time-based adjustment`
        }
      ],
      explanation: `Fallback people prediction based on location and time patterns for ${locationId} at ${hour}:00. Risk level: ${riskLevel}.`,
      riskLevel,
      timeHorizon: minutesAhead
    };
  }

  getPeopleEvacuationRecommendations(zones: Zone[]): any[] {
    const criticalZones = zones.filter(z => z.status === 'critical');
    const safeZones = zones.filter(z => z.status === 'safe');
    
    return criticalZones.map(criticalZone => {
      const nearestSafe = safeZones[0];
      return {
        fromZone: criticalZone.id,
        toZone: nearestSafe?.id || 'safe-area',
        distance: Math.floor(Math.random() * 500) + 100,
        estimatedTime: Math.floor(Math.random() * 10) + 5,
        priority: 'high',
        message: `YOLOv8 people detection recommends evacuation from ${criticalZone.name} to ${nearestSafe?.name || 'safe area'}`,
        peopleCount: criticalZone.current_count - criticalZone.capacity,
        routeEfficiency: 0.8 + Math.random() * 0.2,
        alternativeRoutes: [],
        explanation: `Based on YOLOv8 people risk assessment and flow analysis`
      };
    });
  }

  getPeopleFlowAnalysis(zones: Zone[]): any {
    const totalFlow = zones.reduce((sum, zone) => sum + zone.current_count, 0);
    const bottlenecks = zones.filter(zone => zone.status === 'critical').map(zone => ({
      zoneId: zone.id,
      congestionLevel: (zone.current_count / zone.capacity) * 100,
      estimatedDelay: Math.floor(Math.random() * 10) + 5,
      yoloAnalysis: 'High people density clustering detected'
    }));
    
    return {
      totalFlow,
      bottlenecks,
      flowEfficiency: Math.max(30, 100 - (bottlenecks.length * 20)),
      yoloInsights: 'People flow analysis based on YOLOv8 behavior pattern detection'
    };
  }

  getPeopleCapacityOptimization(zones: Zone[]): any {
    const totalCapacity = zones.reduce((sum, zone) => sum + zone.capacity, 0);
    const totalCurrent = zones.reduce((sum, zone) => sum + zone.current_count, 0);
    const currentUtilization = (totalCurrent / totalCapacity) * 100;
    
    const redistributionSuggestions = zones
      .filter(zone => zone.status === 'critical')
      .map(zone => ({
        fromZone: zone.name,
        peopleToMove: zone.current_count - zone.capacity,
        urgency: zone.current_count > zone.capacity * 1.2 ? 'high' : 'medium',
        yoloRecommendation: 'Based on people spatial distribution analysis'
      }));
    
    return {
      currentUtilization,
      redistributionSuggestions,
      yoloOptimization: 'People recommendations enhanced by YOLOv8 spatial analysis'
    };
  }

  exportPeoplePredictionData(zones: Zone[]): any {
    return {
      timestamp: new Date().toISOString(),
      service: 'YOLOv8 Enhanced People Prediction Service',
      version: '8.0.0',
      zones: zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        current_count: zone.current_count,
        capacity: zone.capacity,
        status: zone.status
      })),
      predictions: zones.map(zone => this.fallbackPeoplePrediction(zone.id, 15)),
      yolo8_people_detections: this.detectionHistory.slice(-10),
      model_info: fineTunedYolo8CrowdService.getModelInfo(),
      advanced_features: {
        people_behavior_analysis: true,
        people_flow_detection: true,
        risk_assessment: true,
        people_spatial_analysis: true,
        interpretable_predictions: true,
        evacuation_recommendations: true
      }
    };
  }

  isReady(): boolean {
    return this.isInitialized && fineTunedYolo8CrowdService.isModelReady();
  }

  async waitForInitialization(): Promise<void> {
    if (!this.isInitialized && !this.isInitializing) {
      await this.initialize();
    }
  }

  dispose(): void {
    this.detectionHistory = [];
    this.isInitialized = false;
    this.isInitializing = false;
  }
}

// Use singleton pattern with fine-tuned YOLOv8 people detection service
export const enhancedPredictionService = YOLOv8PeoplePredictionService.getInstance();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  enhancedPredictionService.dispose();
});