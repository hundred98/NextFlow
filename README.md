# NextFlow App

A mobile application for monitoring and managing n8n workflows on the go.

## Features

- View and monitor your n8n workflows
- Color-coded workflow status indicators:
  - Running status: Yellow indicator
  - Active status: Green background with green indicator
  - Paused status: Gray background with gray indicator
  - Cannot auto-start status: Gray background with gray indicator
- Check execution logs and results
- Quickly enable/disable workflows
- Manually trigger workflows with Manual Trigger, Webhook or Form Trigger nodes
- Location-based triggers
- Camera/gallery triggers
- Sensor data triggers
- Shake gesture triggers
- Lightweight approval and interaction capabilities

## Membership System

The NextFlow App offers a tiered membership system to provide different levels of functionality and services:

### Free Tier (Basic)
- Basic monitoring features: View workflow status and execution logs
- Limited manual triggering capabilities
- Basic notification functions
- Community support

### Professional Tier (Paid)
- Unlimited workflow monitoring
- Advanced triggers: Location, sensors, camera and other hardware triggers
- Full manual triggering functionality
- Priority notifications and reminders
- Advanced security features (app lock, etc.)
- Priority technical support

### Team/Enterprise Tier (Paid)
- Multi-user management
- Team collaboration features
- Advanced security controls
- Dedicated customer support
- Customization options

## Technical Architecture

### Frontend Development
- **Technology Stack**: React Native cross-platform solution
- **Core Interaction Design**:
  - Card-based workflow list display
  - Pull-to-refresh for status updates
  - Long-press menu for quick operations

### Backend Adaptation
- **API Layer**:
  - Dedicated mobile API endpoints
  - Optimized data transmission efficiency
- **Node Development**:
  - Mobile input nodes (location/images/recording)
  - Mobile notification nodes
  - QR code trigger nodes
- **Access Control**:
  - Dedicated "mobile role"
  - Restricted workflow access scope

## Implementation Roadmap

### Phase 1 (MVP+)
- Manual trigger functionality (Webhook GET/Manual Trigger/Form Trigger/Chat Trigger/Execute Workflow Trigger/Schedule Trigger/Cron Trigger/Interval Trigger/Timer Trigger)
- Workflow list viewing
- Basic status monitoring
- Key log viewing
- Goal: Validate core interaction feasibility

### Phase 2 (Core Scenarios)
- Hardware triggers (location/QR code)
- Workflow approval functionality
- In-app notifications
- Goal: Cover core business scenarios

### Phase 3 (Experience Optimization)
- Customizable workflow cards
- Log filtering and export
- Offline sync optimization
- Multi-account switching
- Advanced settings (biometric authentication, auto-logout time)
- Goal: Enhance user experience

## Security Measures

1. **Data Transmission Security**
   - TLS 1.3 encryption
   - API request signature verification

2. **Data Storage Security**
   - System-level encryption for sensitive information
   - Tiered protection for local data

3. **Identity Authentication**
   - Multi-factor authentication (MFA)
   - Fine-grained permission control

4. **Device Security**
   - Root/jailbreak detection
   - App security hardening
   - Auto screen lock protection

5. **Operation Audit**
   - Key operation logging
   - Abnormal behavior interception

6. **Emergency Response**
   - Remote account control
   - Regular security updates