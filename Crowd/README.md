# Divya Drishti (दिव्य  दृष्टि) - Real-Time Crowd Monitoring System

A comprehensive crowd monitoring and evacuation planning system built for Divya Drishti (दिव्य  दृष्टि) using React, TypeScript, Supabase, Leaflet.js, and offline AI detection models.

## Features

### 🎯 Core Capabilities
- **Offline People Detection**: Browser-based ML models using TensorFlow.js with COCO-SSD and MobileNet-SSD
- **Real-time Monitoring**: Live crowd data streaming via Supabase
- **Interactive Maps**: Leaflet.js integration with dynamic heatmaps and evacuation routes
- **Role-based Access**: Admin, Police, and Volunteer user roles
- **Predictive Alerts**: Smart alerting system based on crowd thresholds
- **Multi-source Input**: Support for live camera, CCTV feeds, video uploads, and images

### 🗺️ Map Features
- Dynamic zone heatmaps with color-coded status indicators
- Real-time evacuation route visualization with animated flow indicators
- Interactive zone selection and filtering
- Responsive map controls with zoom, pan, and layer toggles
- Emergency facility markers (medical, police, accessibility)

### 📊 Dashboard Features
- Live crowd count cards with status indicators
- Real-time charts showing crowd trends with predictions
- Smart alert management system with AI-generated alerts
- Video feed integration with Region of Interest (ROI) selection
- Model management for offline AI detection

### 🚨 Alert System
- Automatic threshold-based alerts
- Manual alert acknowledgment with role-based permissions
- Real-time notification system
- AI-powered evacuation recommendations
- Sound and browser notifications

### 🤖 AI Detection Features
- **Offline Models**: COCO-SSD and MobileNet-SSD for people detection
- **Real-time Processing**: Browser-based inference with WebGL acceleration
- **ROI Selection**: User-defined regions of interest for accurate counting
- **Multi-input Support**: Camera, video files, images, and demo feeds
- **Performance Monitoring**: FPS, processing time, and accuracy metrics
## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Maps**: Leaflet.js + React-Leaflet with custom overlays
- **Charts**: Recharts
- **AI/ML**: TensorFlow.js with COCO-SSD and MobileNet-SSD models
- **Icons**: Lucide React
- **Real-time**: Supabase real-time subscriptions

## Setup Instructions

### 1. Database Setup
The database schema is automatically set up through Supabase migrations:
1. Create a new Supabase project
2. The migrations will be applied automatically
3. Enable real-time for the required tables

### 2. Environment Variables
Copy `.env.example` to `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Model Setup
The AI detection models are automatically downloaded when you first use the detection features:
- COCO-SSD (27MB) - High accuracy general purpose detection
- MobileNet-SSD (10MB) - Fast lightweight detection

Models are cached locally for offline use.

## Usage

### Authentication
The system includes demo credentials for testing:
- **Admin**: admin@simhastha.org / admin123
- **Police**: police@simhastha.org / police123
- **Volunteer**: volunteer@simhastha.org / volunteer123

### Detection System
1. Navigate to the "Detection" tab
2. Load AI models using the Model Manager
3. Select a zone and choose input source (camera/video/image)
4. Define Region of Interest (ROI) by drawing or using sliders
5. Start detection to begin real-time people counting
6. Results are automatically saved to the database and broadcast in real-time

### Map Monitoring
1. Go to the "Map" tab
2. Toggle heatmap overlay to see real-time crowd density
3. Enable evacuation routes to see AI-recommended paths
4. Use flow indicators to visualize crowd movement
5. Click on zones for detailed information and status

### Alert Management
1. Visit the "Alerts" tab
2. View smart alerts categorized by type and priority
3. Acknowledge alerts with role-based permissions
4. System automatically generates AI-powered alerts
5. Receive browser and sound notifications for critical alerts

## Architecture

### People Detection
- Uses TensorFlow.js with WebGL acceleration for browser-based inference
- Supports COCO-SSD (high accuracy) and MobileNet-SSD (fast) models
- User-configurable Region of Interest (ROI) with visual drawing tools
- Real-time processing with configurable intervals (0.5-5 seconds)
- Fallback to realistic mock detection if models fail to load

### Real-time System
- Supabase real-time subscriptions for live updates
- WebSocket connections for instant data streaming across all clients
- Automatic zone status updates based on crowd thresholds and AI analysis
- Real-time map updates with animated indicators

### Data Flow
1. Video input → People detection → Count extraction
2. Count data → Supabase database → Real-time broadcast to all clients
3. All connected clients receive updates → UI updates automatically
4. AI threshold analysis → Smart alert generation → Multi-channel notifications
5. Evacuation recommendations → Route visualization → Emergency response

## Security Features

- Row Level Security (RLS) enabled on all tables
- Role-based access control with granular permissions
- Authenticated user policies for data access
- Secure real-time subscriptions
- Client-side data validation

## Performance Optimizations

- Efficient database indexing
- Client-side model caching and data caching
- Optimized real-time subscriptions with filtered updates
- WebGL acceleration for AI inference
- Lazy loading for components and progressive enhancement

## AI Model Details

### COCO-SSD MobileNet
- **Accuracy**: 89%
- **Size**: 27MB
- **Speed**: Medium
- **Best for**: High accuracy general purpose detection
- **Classes**: 80+ objects including person detection

### MobileNet-SSD v2
- **Accuracy**: 85%
- **Size**: 10MB
- **Speed**: Fast
- **Best for**: Real-time applications and mobile devices
- **Classes**: Optimized for person detection

### Fallback Detection
- Realistic crowd simulation based on time patterns
- Simhastha-specific crowd behavior modeling
- Ensures system works even without models
- Maintains full functionality for demonstrations
## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the coding standards
4. Test thoroughly including AI detection features
5. Submit a pull request

## Troubleshooting

### Model Loading Issues
- Ensure you have a stable internet connection for initial model download
- Check browser console for WebGL support
- Clear browser cache if models fail to load
- The system will use fallback detection if models are unavailable

### Real-time Connection Issues
- Verify Supabase credentials in .env file
- Check network connectivity
- The system works in demo mode without Supabase connection

### Performance Issues
- Enable WebGL in your browser for optimal AI performance
- Reduce detection frequency for slower devices
- Use MobileNet-SSD for better performance on mobile devices

## License

MIT License - see LICENSE file for details