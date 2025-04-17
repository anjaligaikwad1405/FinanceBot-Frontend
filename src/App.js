import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [backendStatus, setBackendStatus] = useState("unknown");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // API configuration
  const API_BASE_URL = "https://flask-backend-production-28ed.up.railway.app/";

  const faqs = [
    {
      question: "How do I start investing?",
      answer: "Start by setting financial goals, building an emergency fund, paying off high-interest debt, and then consider investing in index funds or ETFs for beginners."
    },
    {
      question: "What's the difference between stocks and bonds?",
      answer: "Stocks represent ownership in a company, while bonds are debt instruments where you lend money to an entity. Stocks typically offer higher returns with higher risk, bonds offer more stable returns with lower risk."
    },
    {
      question: "How much should I save for retirement?",
      answer: "A common guideline is to save 15-20% of your income for retirement. Consider using tax-advantaged accounts like 401(k)s or IRAs."
    },
    {
      question: "How do I improve my credit score?",
      answer: "Pay bills on time, reduce debt, maintain low credit utilization, avoid opening too many new accounts, and regularly monitor your credit report."
    },
    {
      question: "What is dollar-cost averaging?",
      answer: "Dollar-cost averaging is an investment strategy where you invest a fixed amount regularly, regardless of market conditions, which can reduce the impact of volatility."
    },
    {
      question: "Should I pay off debt or invest?",
      answer: "Generally, prioritize high-interest debt (like credit cards) before investing, but consider the interest rate and potential investment returns in your decision."
    }
  ];

  // Check backend health on component mount
  useEffect(() => {
    checkBackendHealth();
    // Set up interval to check backend health every 30 seconds
    const healthCheckInterval = setInterval(checkBackendHealth, 30000);
    
    // Clear interval on component unmount
    return () => clearInterval(healthCheckInterval);
  }, []);

  // Load user ID and chat history from localStorage when component mounts
  useEffect(() => {
    const savedUserId = localStorage.getItem("userId");
    const savedChats = localStorage.getItem("chatHistory");
    const welcomeShown = localStorage.getItem("welcomeShown");
    const sidebarState = localStorage.getItem("sidebarOpen");
    
    if (savedUserId) {
      setUserId(savedUserId);
    } else {
      // Generate a new user ID
      const newUserId = generateUserId();
      setUserId(newUserId);
      localStorage.setItem("userId", newUserId);
    }
    
    if (savedChats) {
      setChatHistory(JSON.parse(savedChats));
    } else {
      // Add a default welcome message
      const welcomeMessage = { 
        sender: "bot", 
        text: "Welcome to FinanceGURU! I'm your personal financial advisor. How can I help you today?" 
      };
      setChatHistory([welcomeMessage]);
    }

    // Check if welcome screen has been shown before
    if (welcomeShown) {
      setShowWelcome(false);
    }

    // Set sidebar state if saved
    if (sidebarState !== null) {
      setIsSidebarOpen(sidebarState === "true");
    }
  }, []);

  // Generate a unique user ID
  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  };

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sidebarOpen", isSidebarOpen.toString());
  }, [isSidebarOpen]);

  // Auto-scroll to bottom when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  // Focus on input field when the component loads or welcome screen closes
  useEffect(() => {
    if (!showWelcome && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showWelcome]);

  // Check if backend is available
  const checkBackendHealth = async () => {
    try {
      setBackendStatus("checking");
      const res = await axios.get(`${API_BASE_URL}/api/health`);
      if (res.data.status === "ok") {
        setBackendStatus("available");
        console.log("Backend connection successful!");
      } else {
        setBackendStatus("error");
        console.error("Backend health check returned error state");
      }
    } catch (error) {
      setBackendStatus("unavailable");
      console.error("Backend connection failed:", error);
    }
  };

  // Handle form submission for sending messages
  // Replace the sendMessage function in your React frontend with this updated version
  const sendMessage = async (e, faqQuestion = null) => {
    e?.preventDefault();

    const messageToSend = faqQuestion || message;

    if (!messageToSend.trim()) return;

    // Add user message to chat history
    const newUserMessage = { 
      sender: "user", 
      text: messageToSend,
      timestamp: new Date().toISOString() 
    };
    
    setChatHistory(prevHistory => [...prevHistory, newUserMessage]);
    setIsLoading(true);
    setMessage("");

    try {
      // Try to connect to backend, with improved error handling
      const res = await axios.post(`${API_BASE_URL}/api/chat`, {
        user_input: messageToSend,
        user_id: userId
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (res.data && res.data.response) {
        const botResponse = { 
          sender: "bot", 
          text: res.data.response,
          timestamp: new Date().toISOString(),
          sentiment: res.data.sentiment_analysis?.sentiment
        };
        setChatHistory(prevHistory => [...prevHistory, botResponse]);
        setBackendStatus("available");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error:", error);
      setBackendStatus("unavailable");
      
      // Fallback to local FAQ handling
      setTimeout(() => {
        let botResponse;
        // Find FAQ answer if exists
        const faqMatch = faqs.find(faq => 
          faq.question.toLowerCase() === messageToSend.toLowerCase() ||
          messageToSend.toLowerCase().includes(faq.question.toLowerCase())
        );
        
        if (faqMatch) {
          botResponse = { 
            sender: "bot", 
            text: faqMatch.answer,
            timestamp: new Date().toISOString() 
          };
        } else {
          // Default response if no FAQ match
          botResponse = { 
            sender: "bot", 
            text: "I'm sorry, but I can't connect to my financial database right now. Please check your backend connection or try again later.",
            timestamp: new Date().toISOString()
          };
        }
        
        setChatHistory(prevHistory => [...prevHistory, botResponse]);
      }, 1000);
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

// Also update the checkBackendHealth function for more reliable connection checking
  
  // Handle clicking on an FAQ button
  const handleFAQClick = (question) => {
    sendMessage(null, question);
  };

  // Clear chat history
  const clearHistory = () => {
    // Add a welcome message
    const welcomeMessage = { 
      sender: "bot", 
      text: "Welcome to FinanceGURU! How can I help you today?",
      timestamp: new Date().toISOString()
    };
    
    setChatHistory([welcomeMessage]);
    localStorage.setItem("chatHistory", JSON.stringify([welcomeMessage]));
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Start chat after welcome screen
  const startChat = () => {
    setShowWelcome(false);
    localStorage.setItem("welcomeShown", "true");
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      {showWelcome && (
        <div className="welcome-overlay">
          <div className="welcome-content">
            <h1>Welcome to FinanceGURU</h1>
            <p>Your personal AI financial advisor</p>
            {backendStatus === "unavailable" && (
              <div className="backend-warning">
                Warning: Backend service is unavailable. Only FAQ responses will work.
              </div>
            )}
            <button onClick={startChat} className="start-button">Start Chat</button>
          </div>
        </div>
      )}

      <div className={`main-container ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Mobile Menu Button */}
        <button className="menu-toggle" onClick={toggleSidebar}>
          {isSidebarOpen ? '×' : '☰'}
        </button>

        {/* FAQ Sidebar */}
        <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="sidebar-content">
            {faqs.map((faq, index) => (
              <button 
                key={index} 
                onClick={() => handleFAQClick(faq.question)}
                className="faq-button"
              >
                {faq.question}
              </button>
            ))}
          </div>
          <div className={`backend-status ${backendStatus === "available" ? "success" : 
                           backendStatus === "unavailable" ? "error" : 
                           backendStatus === "checking" ? "checking" : "unknown"}`}>
            {backendStatus === "available" ? "Backend Connected" : 
             backendStatus === "unavailable" ? "Backend Not Connected" :
             backendStatus === "checking" ? "Checking Connection..." : "Backend Status Unknown"}
          </div>
          <div className="version-info">
            <span>FinanceGURU v1.2.0</span>
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          <div className="chat-header">
            <h1>FinanceGURU</h1>
            <div className="header-actions">
              <button className="refresh-button" onClick={checkBackendHealth} title="Refresh Connection">
                ↻
              </button>
              <button className="clear-button" onClick={clearHistory} title="Clear Chat History">
                Clear Chat
              </button>
            </div>
          </div>
          
          <div className="chat-messages" ref={chatContainerRef}>
            {chatHistory.map((chat, index) => (
              <div 
                key={index} 
                className={`message ${chat.sender === "user" ? "user-message" : "bot-message"}`}
              >
                <div className="message-bubble">
                  <span className="message-text">{chat.text}</span>
                  {chat.timestamp && (
                    <span className="message-timestamp">{formatTime(chat.timestamp)}</span>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message bot-message">
                <div className="message-bubble loading">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
          </div>
          
          <form className="chat-input" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about finance..."
              disabled={isLoading}
              ref={inputRef}
            />
            <button 
              type="submit" 
              disabled={isLoading || !message.trim()}
              className={message.trim() ? "active" : ""}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
