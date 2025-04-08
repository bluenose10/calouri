import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Info, Download, Mic, MicOff, AppleIcon, FlaskRound, FileText, ServerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateNutritionPDF } from '@/lib/generatePDF';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const EXAMPLE_QUESTIONS = [
  "What foods are high in protein?",
  "How many calories should I eat daily?",
  "How can I meal prep for the week?",
  "What are good post-workout foods?",
  "Is intermittent fasting effective?",
  "Best foods for muscle recovery?",
  "How to reduce sugar cravings?",
  "What's a balanced breakfast?",
];

const FREE_MESSAGE_LIMIT = 5;

const NutriChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "I'm your NutriChat assistant. Ask me any questions about diet, nutrition, recipes, meal planning, and I'll provide factual, authoritative information to help with your health journey.",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [fullResponse, setFullResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { isMobile } = useIsMobile();
  const [ipRestrictionError, setIpRestrictionError] = useState<{ message: string; serverIp: string } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  useEffect(() => {
    if (isTyping && fullResponse) {
      let i = 0;
      const speed = 5; // Reduced from 10 to 5 characters per interval to slow down typing
      
      const typeWriter = () => {
        if (i < fullResponse.length) {
          setTypingText(fullResponse.substring(0, i + speed));
          i += speed;
          setTimeout(typeWriter, 50); // Increased from 30 to 50ms to slow down the typing effect
        } else {
          setTypingText(fullResponse);
          setIsTyping(false);
          
          setMessages(prevMessages => {
            const filteredMessages = prevMessages.filter(m => m.id !== 'typing');
            
            return [...filteredMessages, {
              id: (Date.now() + 1).toString(),
              content: fullResponse,
              sender: 'assistant',
              timestamp: new Date(),
            }];
          });
          
          setFullResponse('');
        }
      };
      
      typeWriter();
    }
  }, [isTyping, fullResponse]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setRecordingStatus('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioToText(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus('recording');
      
      toast({
        title: "Recording started",
        description: "Speak your question clearly...",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const processAudioToText = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });
        
        if (error) {
          console.error('Error in voice-to-text:', error);
          toast({
            title: "Transcription failed",
            description: "Could not convert your speech to text. Please try again.",
            variant: "destructive",
          });
          setRecordingStatus('idle');
          return;
        }
        
        if (data?.text) {
          setInputValue(data.text);
          toast({
            title: "Transcription complete",
            description: `"${data.text}"`,
          });
        } else {
          toast({
            title: "No speech detected",
            description: "Please try again and speak clearly.",
          });
        }
        
        setRecordingStatus('idle');
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: "Could not process audio. Please try again.",
        variant: "destructive",
      });
      setRecordingStatus('idle');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputValue.trim()) return;
    
    if (messageCount >= FREE_MESSAGE_LIMIT && !isPremium) {
      toast({
        title: "Message limit reached",
        description: "You've used all your free messages. Upgrade to Premium to continue using NutriChat.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setMessageCount((prev) => prev + 1);
    setIpRestrictionError(null);

    try {
      console.log("Preparing NutriChat request with user message:", userMessage.content);
      
      const messageHistory = messages.map(msg => ({
        sender: msg.sender,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('nutrichat', {
        body: { 
          message: userMessage.content,
          messageHistory 
        }
      });

      if (error) {
        console.error('Error calling NutriChat function:', error);
        
        if (error.message && error.message.includes("IP")) {
          setIpRestrictionError({
            message: "IP restriction error detected. The FatSecret API requires whitelisting your server's IP address.",
            serverIp: "Unknown"
          });
        }
        
        throw new Error(error.message || 'Failed to get response from NutriChat');
      }

      console.log("Received NutriChat response:", data);
      
      setFullResponse(data.response || "I'm sorry, I couldn't process your request at this time.");
      setIsTyping(true);
      
      setMessages(prev => [...prev, {
        id: 'typing',
        content: '',
        sender: 'assistant',
        timestamp: new Date(),
      }]);
      
    } catch (error) {
      console.error('Error in chat:', error);
      
      if (error.message && typeof error.message === 'string' && error.message.includes("IP restriction")) {
        setIpRestrictionError({
          message: "IP restriction error detected. The FatSecret API requires whitelisting your server's IP address.",
          serverIp: error.serverIp || "Unknown"
        });
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to get a response. Please try again.",
        variant: "destructive",
      });

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setInputValue(question);
  };

  const handleDownloadPDF = () => {
    try {
      const messagesToDownload = messages.filter(m => m.id !== 'typing');
      
      const doc = generateNutritionPDF(
        messagesToDownload.map(msg => ({
          id: msg.id,
          name: msg.sender === 'user' ? 'You' : 'NutriChat',
          timestamp: msg.timestamp.toISOString(),
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealType: msg.sender,
          content: msg.content
        }))
      );
      
      doc.save('nutrichat-conversation.pdf');
      
      toast({
        title: "PDF Downloaded",
        description: "Your conversation has been saved as a PDF.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const formatMessageContent = (content: string) => {
    if (content.includes('|') && content.includes('---')) {
      try {
        const tableLines = content.split('\n').filter(line => line.includes('|'));
        const headerLine = tableLines[0];
        const separatorLine = tableLines[1];
        const dataLines = tableLines.slice(2);
        
        if (headerLine && separatorLine && separatorLine.includes('-')) {
          const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
          
          let tableHtml = '<div class="overflow-x-auto my-3"><table class="w-full border-collapse">';
          
          tableHtml += '<thead><tr>';
          headers.forEach(header => {
            tableHtml += `<th class="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">${header}</th>`;
          });
          tableHtml += '</tr></thead>';
          
          tableHtml += '<tbody>';
          dataLines.forEach(line => {
            const cells = line.split('|').map(c => c.trim()).filter(c => c);
            if (cells.length) {
              tableHtml += '<tr>';
              cells.forEach(cell => {
                tableHtml += `<td class="border border-gray-300 px-3 py-2">${cell}</td>`;
              });
              tableHtml += '</tr>';
            }
          });
          tableHtml += '</tbody></table></div>';
          
          const tableRegex = new RegExp(tableLines.join('\n').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
          content = content.replace(tableRegex, tableHtml);
        }
      } catch (e) {
        console.error('Error formatting table:', e);
      }
    }
    
    content = content.replace(/(\d+)\.\s+([^\n]+)/g, '<div class="ml-4 mb-1"><span class="font-bold mr-2">$1.</span>$2</div>');
    content = content.replace(/\*\s+([^\n]+)/g, '<div class="ml-4 mb-1">• $1</div>');
    content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    content = content.replace(/###\s+([^\n]+)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    content = content.replace(/##\s+([^\n]+)/g, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
    content = content.replace(/\(([A-Za-z]+\s+et\s+al\.,\s+\d{4})\)/g, '<span class="text-gray-500 italic">($1)</span>');
    content = content.replace(/### References/g, '<h3 class="text-lg font-bold mt-5 border-t pt-3">References</h3>');
    content = content.replace(/- ([A-Za-z]+, [A-Z]\. [A-Z]\. \(\d{4}\)\. ".+?"\. .+?, \d+\(\d+\), \d+-\d+\.)/g, 
      '<div class="ml-4 mb-2 text-sm text-gray-600">• $1</div>');
    
    const paragraphs = content.split('\n\n');
    if (paragraphs.length > 1) {
      content = paragraphs.map(p => {
        if (p.trim().startsWith('<')) return p;
        return `<p class="mb-3">${p}</p>`;
      }).join('');
    }
    
    return content;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-health-primary mb-2">NutriChat Assistant</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Get authoritative answers to your nutrition and health questions. Our system combines information from trusted sources with AI technology to provide you with accurate, cited information.
        </p>
      </div>

      {ipRestrictionError && (
        <Alert variant="destructive" className="mb-4 bg-red-50 text-red-800 border-red-300">
          <ServerIcon className="h-4 w-4" />
          <AlertTitle>FatSecret API IP Restriction</AlertTitle>
          <AlertDescription>
            <p>{ipRestrictionError.message}</p>
            <p className="mt-2 text-sm">
              To fix this issue, please go to 
              <a 
                href="https://platform.fatsecret.com/api/Default.aspx?screen=ip" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium mx-1 underline"
              >
                FatSecret IP Restrictions
              </a>
              and add your server's IP address to the whitelist.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-4 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="flex-grow lg:w-3/4 p-4 flex flex-col">
          <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center text-gray-800">
              <MessageSquare className="mr-2 h-5 w-5 text-health-primary" />
              NutriChat
            </h2>
            <Button 
              variant="ghost" 
              onClick={handleDownloadPDF} 
              className="text-gray-600 hover:text-gray-900 hover:bg-health-light hover:text-health-primary transition-colors"
            >
              <Download className="h-5 w-5 mr-1" />
              <span>Download PDF</span>
            </Button>
          </div>

          <div className="p-3 bg-gray-50">
            <Tabs defaultValue="nutritional">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="nutritional" className="text-xs sm:text-sm">
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className={isMobile ? "hidden sm:inline" : ""}>Nutritional Facts</span>
                  <span className={isMobile ? "inline sm:hidden" : "hidden"}>Facts</span>
                </TabsTrigger>
                <TabsTrigger value="science" className="text-xs sm:text-sm">
                  <FlaskRound className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className={isMobile ? "hidden sm:inline" : ""}>Science-Based</span>
                  <span className={isMobile ? "inline sm:hidden" : "hidden"}>Science</span>
                </TabsTrigger>
                <TabsTrigger value="info" className="text-xs sm:text-sm">
                  <Info className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className={isMobile ? "hidden sm:inline" : ""}>Informational Only</span>
                  <span className={isMobile ? "inline sm:hidden" : "hidden"}>Info</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="nutritional" className="mt-2 text-sm text-gray-600">
                <Card>
                  <CardContent className="p-3">
                    Responses include references to nutritional data from reliable sources.
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="science" className="mt-2 text-sm text-gray-600">
                <Card>
                  <CardContent className="p-3">
                    Information drawn from official dietary guidelines and scientific research.
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="mt-2 text-sm text-gray-600">
                <Card>
                  <CardContent className="p-3">
                    Not medical advice. Consult a healthcare professional for specific health issues.
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex-grow overflow-auto bg-white p-4 min-h-[300px] max-h-[400px]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-health-primary text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.id === 'typing' ? (
                      <div className="prose prose-sm">
                        <div dangerouslySetInnerHTML={{ __html: formatMessageContent(typingText) || '' }} />
                        <div className="flex space-x-2 mt-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm">
                        <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && !isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-800">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="mt-4 flex space-x-2">
            <div className="flex-grow flex">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a nutrition question..."
                className="flex-grow rounded-r-none"
                disabled={recordingStatus === 'processing' || (messageCount >= FREE_MESSAGE_LIMIT && !isPremium)}
              />
              <Button 
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                className="rounded-l-none border-l-0 w-12"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={recordingStatus === 'processing' || (messageCount >= FREE_MESSAGE_LIMIT && !isPremium)}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading || (messageCount >= FREE_MESSAGE_LIMIT && !isPremium) || recordingStatus === 'processing'}
              className="bg-health-primary hover:bg-health-primary/90"
            >
              <Send className="h-4 w-4 mr-1" />
              <span>Send</span>
            </Button>
          </form>

          {recordingStatus === 'processing' && (
            <div className="mt-2 text-xs text-gray-600 animate-pulse">
              Processing your speech...
            </div>
          )}

          {!isPremium && (
            <div className="mt-3 text-xs text-gray-600 flex justify-between items-center">
              <div className="flex items-center">
                <Info className="h-3 w-3 mr-1" />
                <span>{FREE_MESSAGE_LIMIT - messageCount} free messages remaining</span>
              </div>
              <Button 
                variant="link" 
                size="sm" 
                className="text-health-primary p-0 h-auto"
                onClick={() => setIsPremium(true)}
              >
                Upgrade to Premium
              </Button>
            </div>
          )}
        </div>

        <div className="lg:w-1/4 bg-gray-50 p-4 border-l border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">Example Questions</h3>
          <div className="space-y-2">
            {EXAMPLE_QUESTIONS.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleExampleClick(question)}
                className="w-full justify-start text-sm text-gray-700 bg-health-light"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutriChat;
