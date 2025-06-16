import React, { useState, useEffect, useRef } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Backend API URL - adjust if your backend runs on a different port
  const API_BASE_URL = "http://127.0.0.1:5000";

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

  // Enhanced FAQ responses for offline mode
  const getFinancialAdvice = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('invest') || message.includes('investing') || message.includes('investment')) {
      return "For beginners, I recommend starting with low-cost index funds or ETFs. They provide instant diversification and historically solid returns. Consider opening a tax-advantaged account like an IRA or 401(k) first. Remember to only invest money you won't need for at least 5-10 years.";
    }
    
    if (message.includes('budget') || message.includes('budgeting') || message.includes('expenses')) {
      return "A good budgeting strategy is the 50/30/20 rule: 50% for needs (rent, groceries, utilities), 30% for wants (entertainment, dining out), and 20% for savings and debt repayment. Track your expenses for a month to see where your money actually goes, then adjust accordingly.";
    }
    
    if (message.includes('emergency fund') || message.includes('emergency') || message.includes('savings')) {
      return "Aim to save 3-6 months of living expenses in an easily accessible account. Start with $1,000 as your initial goal, then gradually build up. Keep this money in a high-yield savings account or money market account for better returns while maintaining liquidity.";
    }
    
    if (message.includes('debt') || message.includes('credit card') || message.includes('loan')) {
      return "Focus on paying off high-interest debt first (like credit cards). Consider the debt avalanche method: pay minimums on all debts, then put extra money toward the highest interest rate debt. For lower interest debt, you might consider investing instead if you can earn higher returns.";
    }
    
    if (message.includes('credit score') || message.includes('credit')) {
      return "To improve your credit score: pay all bills on time (35% of score), keep credit utilization below 30% (30% of score), maintain old accounts to increase credit history length (15%), limit new credit inquiries (10%), and have a mix of credit types (10%). Check your credit report annually for errors.";
    }
    
    if (message.includes('retirement') || message.includes('401k') || message.includes('ira')) {
      return "Start retirement saving as early as possible to benefit from compound interest. Contribute enough to your 401(k) to get the full company match (free money!). Then consider maxing out a Roth IRA. For 2024, you can contribute up to $23,000 to a 401(k) and $7,000 to an IRA ($8,000 if 50+).";
    }
    
    // Check against FAQ questions for exact matches
    const faqMatch = faqs.find(faq => 
      faq.question.toLowerCase().includes(message) ||
      message.includes(faq.question.toLowerCase().split(' ').slice(0, 3).join(' '))
    );
    
    if (faqMatch) {
      return faqMatch.answer;
    }
    
    return "I'm here to help with your financial questions! I can provide advice on investing, budgeting, saving, debt management, credit scores, retirement planning, insurance, taxes, and more. Feel free to ask about any specific financial topic, or click on the FAQ questions in the sidebar for common advice.";
  };

  // Check backend connectivity
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(data.status || "connected");
        setIsOnlineMode(true);
        console.log("Backend connected:", data);
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      console.log("Backend not available, running in offline mode:", error.message);
      setBackendStatus("offline");
      setIsOnlineMode(false);
    }
  };

  // Load user ID and chat history when component mounts
  useEffect(() => {
    const newUserId = generateUserId();
    setUserId(newUserId);
    
    // Check backend status
    checkBackendStatus();
    
    // Add a default welcome message
    const welcomeMessage = { 
      sender: "bot", 
      text: "Welcome to FinanceGURU! I'm your personal financial advisor. How can I help you today?" 
    };
    setChatHistory([welcomeMessage]);
  }, []);

  // Generate a unique user ID
  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  };

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

  // Send message to backend or use offline mode
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
      if (isOnlineMode) {
        // Try to send to backend
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_input: messageToSend,
            user_id: userId,
            conversation_history: chatHistory.slice(-10) // Send last 10 messages for context
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const botResponse = { 
            sender: "bot", 
            text: data.response,
            timestamp: new Date().toISOString(),
            source: data.demo_mode ? "backend_demo" : "backend_ai",
            market_data: data.market_data_included || false
          };
          setChatHistory(prevHistory => [...prevHistory, botResponse]);
        } else {
          throw new Error('Backend request failed');
        }
      } else {
        throw new Error('Backend not available');
      }
    } catch (error) {
      console.log("Using offline mode:", error.message);
      // Fallback to offline mode
      setTimeout(() => {
        const response = getFinancialAdvice(messageToSend);
        const botResponse = { 
          sender: "bot", 
          text: response + "\n\n💡 *Running in offline mode - connect to backend for real-time market data and AI insights*",
          timestamp: new Date().toISOString(),
          source: "offline"
        };
        setChatHistory(prevHistory => [...prevHistory, botResponse]);
      }, 1000);
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  // Handle clicking on an FAQ button
  const handleFAQClick = (question) => {
    sendMessage(null, question);
  };

  // Clear chat history
  const clearHistory = () => {
    const welcomeMessage = { 
      sender: "bot", 
      text: "Welcome to FinanceGURU! How can I help you today?",
      timestamp: new Date().toISOString()
    };
    
    setChatHistory([welcomeMessage]);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Start chat after welcome screen
  const startChat = () => {
    setShowWelcome(false);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Retry backend connection
  const retryBackendConnection = () => {
    setBackendStatus("checking");
    checkBackendStatus();
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status color and text
  const getStatusInfo = () => {
    switch (backendStatus) {
      case "connected":
      case "ok":
        return { color: "text-green-600", bg: "bg-green-50", text: "Backend Connected" };
      case "degraded":
        return { color: "text-yellow-600", bg: "bg-yellow-50", text: "Limited Functionality" };
      case "checking":
        return { color: "text-blue-600", bg: "bg-blue-50", text: "Checking Backend..." };
      case "offline":
      default:
        return { color: "text-orange-600", bg: "bg-orange-50", text: "Offline Mode" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">₹</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to FinanceGURU</h1>
              <p className="text-gray-600">Your personal AI financial advisor</p>
            </div>
            <div className={`mb-6 text-sm ${statusInfo.color} ${statusInfo.bg} p-3 rounded-lg`}>
              {statusInfo.text}
              {isOnlineMode && " - Real-time market data available"}
            </div>
            <button 
              onClick={startChat} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
              Start Chat
            </button>
          </div>
        </div>
      )}

      <div className={`flex h-screen ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden fixed top-4 left-4 z-40 bg-white rounded-lg p-2 shadow-lg text-gray-700"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? '×' : '☰'}
        </button>

        {/* FAQ Sidebar */}
        <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white shadow-xl transition-all duration-300 overflow-hidden`}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Frequently Asked Questions</h2>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto h-full">
            {faqs.map((faq, index) => (
              <button 
                key={index} 
                onClick={() => handleFAQClick(faq.question)}
                className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all duration-200 text-sm"
              >
                {faq.question}
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200">
            <div className={`text-center text-sm ${statusInfo.color} ${statusInfo.bg} p-2 rounded mb-2 flex items-center justify-between`}>
              <span>{statusInfo.text}</span>
              {backendStatus === "offline" && (
                <button 
                  onClick={retryBackendConnection}
                  className="text-xs underline hover:no-underline"
                >
                  Retry
                </button>
              )}
            </div>
            <div className="text-center text-xs text-gray-500">
              FinanceGURU v2.0.0
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white shadow-md p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">₹</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">FinanceGURU</h1>
                <div className={`ml-3 px-2 py-1 rounded-full text-xs ${statusInfo.color} ${statusInfo.bg}`}>
                  {isOnlineMode ? "🟢 Online" : "🟡 Offline"}
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200"
                  onClick={clearHistory}
                  title="Clear Chat History"
                >
                  Clear Chat
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
            {chatHistory.map((chat, index) => (
              <div 
                key={index} 
                className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  chat.sender === "user" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white" 
                    : "bg-white shadow-md text-gray-800 border border-gray-200"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{chat.text}</p>
                  <div className="flex items-center justify-between mt-1">
                    {chat.timestamp && (
                      <p className={`text-xs ${
                        chat.sender === "user" ? "text-blue-100" : "text-gray-500"
                      }`}>
                        {formatTime(chat.timestamp)}
                      </p>
                    )}
                    {chat.source && chat.sender === "bot" && (
                      <div className="flex space-x-1 text-xs">
                        {chat.source === "backend_ai" && <span title="AI Response">🤖</span>}
                        {chat.source === "backend_demo" && <span title="Demo Mode">🧪</span>}
                        {chat.market_data && <span title="Market Data Included">📊</span>}
                        {chat.source === "offline" && <span title="Offline Mode">📴</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white shadow-md text-gray-800 border border-gray-200 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex space-x-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isOnlineMode ? "Ask about finance or specific stocks..." : "Ask about finance..."}
                disabled={isLoading}
                ref={inputRef}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                onClick={sendMessage}
                disabled={isLoading || !message.trim()}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  message.trim() && !isLoading
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
