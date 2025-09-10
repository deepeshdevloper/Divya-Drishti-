# 🚀 Complete Supabase Setup Guide for Divya Drishti (दिव्य  दृष्टि)

## ✅ Quick Setup Checklist

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Project name: `simhastha-2028-crowd-monitoring`
3. Set a strong database password
4. Select region closest to India (Mumbai/Singapore recommended)

### 2. Configure Environment Variables
1. Copy your project URL and anon key from Supabase dashboard
2. Update `.env` file with your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Run Database Migrations
Execute these SQL files **in order** in your Supabase SQL Editor:

**IMPORTANT**: Copy and paste the **entire content** of each file into the SQL Editor and run them one by one.

#### Step 1: Initial Schema
```sql
-- Copy and paste the ENTIRE content from supabase/migrations/001_initial_schema.sql
-- This creates all tables, RLS policies, and indexes
-- Make sure to run the complete file, not just parts of it
```

#### Step 2: Views and Functions
```sql
-- Copy and paste the ENTIRE content from supabase/migrations/002_create_views_and_functions.sql
-- This creates views, functions, and triggers
-- Wait for this to complete before proceeding
```

#### Step 3: Demo Data
```sql
-- Copy and paste the ENTIRE content from supabase/migrations/003_insert_demo_data.sql
-- This inserts demo users, zones, and sample data
-- This will populate the system with realistic demo data
```

#### Step 4: Real-time Setup
```sql
-- Copy and paste the ENTIRE content from supabase/migrations/004_create_realtime_setup.sql
-- This enables real-time features and creates triggers
-- This enables live updates across the system
```

### 4. Enable Real-time Features
In your Supabase dashboard:
1. Go to **Database → Replication**
2. Enable real-time for these tables:
   - ✅ `crowd_counts`
   - ✅ `alerts`
   - ✅ `zones`
   - ✅ `evacuation_routes`
   - ✅ `users`

### 5. Configure Authentication
1. Go to **Authentication → Settings**
2. **Disable** email confirmations for demo (enable in production)
3. Set **Site URL** to `http://localhost:5173`
4. Add **Redirect URLs** if needed

### 6. Test the Setup
1. **Start the application**: `npm run dev`
2. **Check browser console** for connection status
3. **Login with demo credentials** (see below)
4. **Verify real-time updates** work in the dashboard
5. **Test detection system** with demo videos

## 🎭 Demo Credentials & Users

The system includes these demo users for testing:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@simhastha.org | admin123 | Full system access |
| **Police** | police@simhastha.org | police123 | All zones, alerts, evacuation |
| **Volunteer** | volunteer@simhastha.org | volunteer123 | Assigned zones only |
| **Medical** | medical@simhastha.org | medical123 | Medical zones |
| **Security** | security@simhastha.org | security123 | Security zones |

## 🗺️ Demo Zones (Ujjain Simhastha Ghats)

| Zone ID | Name | Capacity | Coordinates | Facilities |
|---------|------|----------|-------------|------------|
| `ram-ghat` | Ram Ghat | 500 | [23.1770, 75.7890] area | Medical, Police, Accessibility |
| `mahakal-ghat` | Mahakal Ghat | 800 | [23.1760, 75.7880] area | Medical, Police, Temple |
| `bhairav-ghat` | Bhairav Ghat | 900 | [23.1750, 75.7870] area | Medical, Police, Food |
| `narsingh-ghat` | Narsingh Ghat | 600 | [23.1740, 75.7860] area | Medical, Accessibility |
| `kshipra-ghat` | Kshipra Ghat | 700 | [23.1780, 75.7900] area | Police, Parking, Food |

## 🔧 Key Features Enabled

### ✅ Real-time Data Streaming
- Live crowd counts update automatically
- Instant alert notifications
- Zone status changes in real-time

### ✅ Automatic Alert Generation
- **Critical**: >90% capacity → Immediate evacuation alert
- **Warning**: >70% capacity → Monitor closely alert
- **Info**: System status updates

### ✅ Smart Analytics
- Historical crowd trends
- Peak hour analysis
- Capacity optimization recommendations

### ✅ Role-based Security
- Row Level Security (RLS) enabled
- User permissions by role
- Zone-based access control

## 🚨 Demo Scenarios

Test different crowd scenarios:

```sql
-- Normal operations
SELECT generate_demo_scenario('normal');

-- Peak festival hours (high crowds)
SELECT generate_demo_scenario('peak_hour');

-- Emergency situation (low crowds)
SELECT generate_demo_scenario('emergency');

-- Night time (minimal crowds)
SELECT generate_demo_scenario('night_mode');
```

## 📊 Useful SQL Queries

### Get Real-time Dashboard Data
```sql
SELECT get_dashboard_data();
```

### View Current Zone Status
```sql
SELECT * FROM live_zone_status ORDER BY occupancy_rate DESC;
```

### Check Recent Alerts
```sql
SELECT * FROM recent_alerts WHERE NOT acknowledged ORDER BY timestamp DESC;
```

### Get Evacuation Recommendations
```sql
SELECT get_evacuation_recommendations();
```

### View Analytics
```sql
SELECT * FROM zone_analytics ORDER BY avg_count DESC;
```

## 🔄 Real-time Subscriptions

The system automatically subscribes to:
- **crowd_counts** → Live people counting updates
- **alerts** → Instant alert notifications  
- **zones** → Zone status changes

## 🛡️ Security Features

### Row Level Security Policies
- **Users**: Can only read own profile (admins see all)
- **Zones**: Everyone can read, admins can modify
- **Crowd Counts**: Role-based access to assigned zones
- **Alerts**: Users see alerts for their zones only

### Authentication
- Supabase Auth integration
- Role-based permissions
- Secure API endpoints

## 📈 Performance Features

### Optimized Indexes
- Fast crowd count queries by location and time
- Efficient alert filtering
- Quick zone status lookups

### Materialized Views
- `zone_analytics` → Pre-computed zone statistics
- `daily_crowd_summary` → Historical summaries
- Auto-refresh every 5 minutes

### Automatic Cleanup
- Crowd counts older than 7 days
- Acknowledged alerts older than 30 days
- Unacknowledged alerts older than 3 days

## 🧪 Testing the System

### 1. Test Real-time Updates
1. Open the app in two browser windows
2. In one window, go to Detection tab and start detection
3. Watch the other window update automatically

### 2. Test Alert System
1. Generate high crowd scenario: `SELECT generate_demo_scenario('peak_hour');`
2. Watch alerts appear automatically
3. Acknowledge alerts and see them update

### 3. Test Role-based Access
1. Login as different user roles
2. Verify each role sees appropriate zones and features
3. Test permissions (volunteers can't manage detection)

## 🐛 Troubleshooting

### Common Issues

#### Real-time not working
- ✅ Check if tables are added to replication in Supabase dashboard
- ✅ Verify environment variables are correct
- ✅ Check browser console for WebSocket errors

#### RLS blocking queries
- ✅ Verify user roles in database
- ✅ Check RLS policies are correctly applied
- ✅ Ensure user is authenticated

#### Demo users not working
- ✅ Run the demo data migration (002_insert_demo_data.sql)
- ✅ Check if users table is populated
- ✅ Verify authentication is working

#### Performance issues
- ✅ Run `SELECT refresh_analytics_views();`
- ✅ Check if indexes are created
- ✅ Monitor database performance in Supabase

### Debug Queries

```sql
-- Check user permissions
SELECT * FROM users WHERE email = 'admin@simhastha.org';

-- Verify zone data
SELECT * FROM zones ORDER BY name;

-- Check recent crowd counts
SELECT * FROM crowd_counts ORDER BY timestamp DESC LIMIT 10;

-- View system status
SELECT get_dashboard_data();

-- Test real-time functions
SELECT get_zone_realtime_update('ram-ghat');
```

## 🎯 Production Checklist

Before deploying to production:

- [ ] Enable email confirmations in Supabase Auth
- [ ] Set up proper backup policies
- [ ] Configure production environment variables
- [ ] Enable SSL and security headers
- [ ] Set up monitoring and alerting
- [ ] Test with real CCTV feeds
- [ ] Configure proper user roles and permissions
- [ ] Set up data retention policies
- [ ] Enable audit logging
- [ ] Test evacuation procedures

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Verify all migrations ran successfully**
3. **Test with demo credentials provided**
4. **Check Supabase dashboard for errors**
5. **Monitor browser console for client-side errors**

The system is designed to work seamlessly with realistic demo data, enabling full testing of all crowd monitoring, alerting, and evacuation features for the Divya Drishti (दिव्य  दृष्टि) event.

---

## 🎉 Success!

Once setup is complete, you'll have:
- ✅ Real-time crowd monitoring system
- ✅ Automatic alert generation
- ✅ Role-based user access
- ✅ Interactive map with heatmaps
- ✅ Evacuation route planning
- ✅ Offline people detection
- ✅ Complete demo environment

**Ready for Divya Drishti (दिव्य  दृष्टि)! 🕉️**