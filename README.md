# 🤖 RavenGPT - Advanced Frontend AI Assistant

A powerful, feature-rich RavenGPT application that runs entirely in your browser. No backend server required! Features reasoning models, web search, vision capabilities, and file uploads - all powered by your OpenRouter API key.

![RavenGPT](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)

---

## 👨‍💻 About This Project

**Created by: wh1sky02**

⚠️ **Development Status**: This application is currently in the **development phase**. While we strive for stability and reliability, you may encounter occasional bugs, features being refined, or unexpected behavior. Regular updates and improvements are being made continuously.

### What to Expect:
- 🐛 Potential bugs or issues (actively being fixed)
- 🚧 Features still being refined and improved  
- 📈 Regular updates with new capabilities
- 🔧 Performance optimizations ongoing

**Need Help?** If you encounter issues, try refreshing the page, checking your API key, or switching AI providers in settings.

---

## ✨ Advanced Features

### 🔐 **Core Features**
- **Secure & Private**: Your API key is stored locally in your browser only
- **100% Free**: Use OpenRouter's free AI models with your own API key
- **No Backend**: Runs entirely in your browser
- **Beautiful UI**: Modern, responsive design with dark mode support
- **Mobile Friendly**: Optimized for all screen sizes

### 🧠 **AI Capabilities**
- **4 Specialized Modes**: Standard, Reasoning, Web Search, and Vision
- **Reasoning Models**: Deep thinking with visible reasoning process (R1, QwQ, etc.)
- **Web Search Integration**: Real-time internet information with citations
- **Vision Analysis**: Upload and analyze images with AI
- **File Upload**: Support for images and documents
- **Dynamic Model Discovery**: Automatically fetches and filters models by capability

### 💬 **Chat Experience**
- **Real-time Streaming**: Smooth, responsive chat experience
- **Markdown Rendering**: Rich text formatting in AI responses
- **Copy Messages**: Easy one-click message copying
- **Message Citations**: See sources for web search results
- **Reasoning Display**: Toggle visibility of AI thinking process
- **File Attachments**: Visual display of uploaded files

## 🎯 Feature Modes

### 🤖 **Standard Mode**
- Basic AI conversation
- All available free models
- Text-based interactions
- Fast and lightweight

### 🧠 **Reasoning Mode**
- Advanced thinking models (DeepSeek R1, QwQ, etc.)
- Visible reasoning process
- Configurable reasoning effort (Low/Medium/High)
- Toggle reasoning display on/off
- Perfect for complex problems and analysis

### 🌐 **Web Search Mode**
- Real-time internet access
- Automatic source citations
- Configurable search context depth
- Up-to-date information retrieval
- Works with any compatible model

### 👁️ **Vision Mode**
- Image upload and analysis
- Multi-modal conversations
- Support for various image formats
- Visual understanding and description
- Combines images with text queries

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **React Markdown** - Markdown rendering
- **OpenRouter API** - AI model access

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd ai-chatbot
npm install
```

### 2. Get Your OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/keys)
2. Create a free account
3. Generate your API key
4. **Important**: OpenRouter offers free credits for new users, and many models are completely free!

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Start Chatting

1. Click the settings icon or "Set API Key to Get Started" button
2. Paste your OpenRouter API key
3. Choose your preferred AI model
4. Start chatting!

## 🆓 Dynamic Free Models

The app automatically fetches the latest free models from OpenRouter:

- **Real-time Model Discovery** - Always up-to-date with OpenRouter's free offerings
- **Automatic Filtering** - Only shows models with $0.00 pricing
- **Fallback Models** - Includes backup models if API fetch fails
- **Refresh Capability** - Manual refresh button to get the latest models
- **Model Descriptions** - Hover over models to see descriptions

Current fallback models include:
- **Llama 3.2 3B Instruct** - Meta's efficient model
- **Llama 3.2 1B Instruct** - Lightweight and fast
- **Zephyr 7B Beta** - Hugging Face's fine-tuned model
- **OpenChat 7B** - Optimized for conversations
- **Mistral 7B Instruct** - Powerful instruction-following model

## 🔒 Privacy & Security

- **Local Storage Only**: Your API key never leaves your browser
- **No Data Collection**: We don't store or track any conversations
- **Direct API Calls**: Messages go directly from your browser to OpenRouter
- **Open Source**: Full transparency - check the code yourself

## 📱 Usage Tips

### 💬 **Basic Usage**
- **Enter Key**: Press Enter to send messages quickly
- **Copy Feature**: Hover over any message to see the copy button
- **Clear Chat**: Use the "Clear" button to start fresh
- **Dark Mode**: The app automatically adapts to your system theme

### 🔧 **Model Management**
- **Mode Switching**: Use the mode selector to switch between Standard, Reasoning, Web Search, and Vision
- **Smart Filtering**: Models automatically filter based on selected mode capabilities
- **Refresh Models**: Click the refresh icon to update the models list
- **Model Info**: Hover over model names to see descriptions

### 🎨 **Advanced Features**
- **File Upload**: Drag & drop or click upload button for images/documents
- **Reasoning Control**: Adjust reasoning effort and toggle display in Reasoning mode
- **Web Search**: Configure search context depth for better results
- **Citations**: Click on source links in web search responses
- **Attachments**: Remove uploaded files by clicking the X button

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Project Structure

```
ai-chatbot/
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout
│       ├── page.tsx        # Main chatbot component
│       └── globals.css     # Global styles
├── public/                 # Static assets
├── package.json           # Dependencies
└── README.md              # This file
```

## 🔧 Customization

### Adding More Models

Edit the `FREE_MODELS` array in `src/app/page.tsx`:

```typescript
const FREE_MODELS = [
  { id: 'your-model-id', name: 'Your Model Name' },
  // ... existing models
];
```

### Styling

The app uses Tailwind CSS. Modify classes in the components or extend the theme in `tailwind.config.ts`.

### API Configuration

The app is configured for OpenRouter, but you can modify the API endpoint and headers in the `sendMessage` function.

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid API Key"**: Double-check your OpenRouter API key
2. **Network Errors**: Check your internet connection
3. **Model Not Responding**: Try a different model from the dropdown
4. **CORS Errors**: This shouldn't happen with OpenRouter, but ensure you're accessing via HTTP/HTTPS

### Getting Help

- Check the browser console for error messages
- Verify your API key has sufficient credits on OpenRouter
- Try different models if one isn't working

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

**Development Status**: This project is currently in active development by **wh1sky02**.

While contributions are welcome, please note:
- This is a personal development project in beta phase
- Expect frequent updates and changes
- Some features may be experimental or unstable
- Bug reports and suggestions are especially valuable

Ways to contribute:
- 🐛 Report bugs and issues
- 💡 Suggest new features or improvements  
- 📚 Help improve documentation
- ⭐ Star the project if you find it useful

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Created by**: wh1sky02
- **Status**: Development Phase (Beta)
- **Built with**: Next.js 15, TypeScript, Tailwind CSS
- **Powered by**: OpenRouter, Groq, Together AI APIs

## 🌟 Show Your Support

If you find this project helpful, please give it a star! ⭐

---

**⚠️ Development Notice**: This application is under active development. Expect updates, improvements, and occasional issues as new features are added and refined.

**Built with ❤️ by wh1sky02 using Next.js and AI APIs**
