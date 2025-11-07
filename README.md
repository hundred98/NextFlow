# n8n Mobile App
[中文文档](README-zh.md)

A mobile application for monitoring and managing n8n workflows anytime, anywhere, making your automation process management more convenient and efficient.

> **Important Notice**:
> - Please pay special attention to the 【Most Important Security Settings】 section
> - This project is not intended for commercial use by default, and is provided for personal learning and use only
> - Commercial use requirements: Please contact the author to obtain formal authorization
> - Security consideration: If you have concerns about data security, please do not use this project, and it is prohibited to use this project in any commercially sensitive scenarios
> - Disclaimer: The author is not responsible for any issues arising during personal use

## Features

- View and monitor your n8n workflows
- n8n server connection settings, including server address and authentication methods
- Security authentication support (Basic, Header, JWT)
- Color-coded workflow status indicators:
  - Running status: Green background with green indicator
  - Active status: Green background with green indicator
  - Paused status: Gray background with gray indicator
  - Cannot activate status: Gray background with gray indicator
- View specific workflow execution logs and results
- View specific workflow node details
- Quickly enable/disable workflows
- App password lock feature to protect your application security
- All settings and data are stored locally on your device and will not be uploaded to any server
- Error log recording and viewing for troubleshooting

## Installation and Usage

### 1. Install n8n Community Node
Please search for and install the `n8n-nodes-mobile` node in the Community nodes section under Settings

### 2. Configure n8n

#### 2.1 Import Workflow
Create a new blank workflow and import: `n8n-reference-demo.json`

#### 2.2 Configure API Credentials
Create or add n8n API credentials:
![API Credentials Configuration](n8n-api.png)

Ensure both Mobile App Integrations are properly configured.

#### 2.3 ⚠️⚠️⚠️ 【Most Important Security Settings】 Configure Authentication ⚠️⚠️⚠️

> **Security Warning**: This is the most important step to protect your workflow assets! Please ensure you set secure authentication credentials.

Configure your Authentication method in both Webhooks:
![Authentication Settings](Authentication.png)

1. Select an authorization method (Basic Auth is recommended)
2. Create a new credential
3. **Set a complex username and password**, avoiding simple passwords

#### 2.4 Activate Workflow
After completing the above configuration, activate this workflow:
![Activate Workflow](Active.png)

### 3. Download Mobile App
Download the NextFlow APP
Please visit the GitHub Release page of this project to download the latest version of the NextFlow APP

### 4. Configure Mobile App

1. Open NextFlow APP and click the "Settings" icon
2. On the "Settings" page, click the edit button for "n8n Server URL" and enter your n8n server address
3. On the "Settings" page, click the edit button for "Authentication Settings", select the authentication method you configured in n8n, then click "Username" and "Password" to enter the username and password you configured in n8n
4. If the URL address, authentication method, username, and password are all correct, the n8n workflows will be displayed in the workflow list

## Notes

- Please ensure your n8n server is accessible from external networks (if you want to use it from non-local networks)
- Update passwords regularly to ensure security
- All settings and data are stored locally on your device and will not be uploaded to any server

## Troubleshooting

- **Connection failure**: Please check if the n8n server URL is correct, network connection is normal, and authentication information is correct
- **Workflows not displayed**: Ensure you have correctly configured the authentication information and the workflows have been activated
- **App crashes**: Try clearing app data or reinstalling the app

## Author

- **hundred98** - hundred98@163.com

## Repository

- GitHub: https://github.com/hundred98/NextFlow

## Email Support

- You can contact me by sending an email to hundred98@163.com
- I will try my best to reply to your questions, but please allow some delay as I may have other work to handle

## 📱 WeChat Support

If you have any questions or suggestions, please follow my WeChat official account for technical support:

<div align="center">
  <img src="./assets/wechat-qr.jpg" alt="WeChat QR Code" width="200"/>
  <br>
  <em>Scan to follow the WeChat official account</em>
</div>