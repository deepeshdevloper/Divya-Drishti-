# Divya Drishti (दिव्य दृष्टि) - Crowd & Vehicle Monitoring System

## 📁 Public Repository
[GitHub Repository Link](https://github.com/deepeshdevloper/Divya-Drishti-.git) - Accessible without login restrictions

## 🎯 Problem Statement

Ujjain's Simhastha Kumbh Mela attracts millions of pilgrims, creating massive challenges in:
- **Vehicle congestion** at parking areas and entry points
- **Human overcrowding** at ghats, temples, and processional routes
- **Safety risks** due to limited real-time monitoring capabilities
- **Delayed emergency response** without predictive analytics

## 💡 Solution Overview

Divya Drishti is a comprehensive web-based monitoring system that provides:

### Dual Monitoring Capabilities
1. **Real-Time Crowd Monitoring** - AI-powered people counting with heatmaps and evacuation planning
2. **Vehicle Occupancy Detection** - Smart parking management with occupancy alerts

### Key Features

#### 🧠 AI-Powered Detection
- Browser-based object detection using TensorFlow.js and ONNX models
- Real-time processing of live feeds, uploaded videos, and images
- Custom Region of Interest (ROI) selection for focused analysis
- Cultural-aware crowd behavior recognition

#### 🗺️ Interactive Mapping
- Leaflet.js integration with Ujjain-specific maps
- Dynamic heatmaps with color-coded density indicators
- Real-time evacuation route visualization
- Zone-based filtering and monitoring

#### 📊 Dashboard & Analytics
- Role-based access (Admin, Police, Volunteer)
- Real-time statistics and trend analysis
- Predictive crowd forecasting
- Alert system with threshold-based notifications

#### 🚨 Safety & Security
- Stampede prevention through early warning system
- Traffic congestion management
- Emergency evacuation planning
- Multi-channel alert system

## 🛠️ Technology Stack

**Frontend:** React 18 + TypeScript + Tailwind CSS  
**Maps:** Leaflet.js + React-Leaflet  
**AI/ML:** TensorFlow.js, COCO-SSD, MobileNet models  
**Backend:** Supabase (PostgreSQL, Auth, Realtime)  
**Detection:** YOLOv5/YOLOv8 via ONNX Runtime Web  
**Charts:** Chart.js + react-chartjs-2

## 🚀 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/deepeshdevloper/Divya-Drishti-.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

## 📋 Usage

1. **Login** with role-specific credentials (Admin, Police, Volunteer)
2. **Select monitoring mode** (Crowd or Vehicle detection)
3. **Configure ROI** by drawing regions of interest on the map/video feed
4. **Monitor real-time data** on the interactive dashboard
5. **Receive alerts** when thresholds are exceeded
6. **View evacuation routes** and emergency recommendations

## 🔮 Future Scope

- Drone integration for aerial monitoring
- 30-minute crowd prediction analytics
- Multi-city adaptation capability
- License plate recognition for traffic management
- Advanced evacuation simulation software

## ✅ Conclusion

Divya Drishti provides a comprehensive, scalable solution for managing both crowd and vehicle movement during large-scale events like Simhastha 2028. By leveraging browser-based AI and real-time analytics, the system enables authorities to prevent overcrowding, manage traffic flow, and respond quickly to emergencies, ensuring a safer experience for millions of pilgrims.

---

**Team Nathun Digital Solutions**  
**Hackathon Theme:** Safety, Security, Surveillance  
**Registration Number:** TH1336