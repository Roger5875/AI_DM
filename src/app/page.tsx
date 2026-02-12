'use client';

import React, {useState, useEffect} from 'react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {generateStoryFromPrompt} from '@/ai/flows/generate-story-from-prompt';
import {interpretPlayerCommand} from '@/ai/flows/interpret-player-command';
import { Volume2, VolumeX } from 'lucide-react';

export default function Home() {
  const [gameText, setGameText] = useState<string>('Welcome to Quest Weaver!\n');
  const [gameState, setGameState] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [settingPreferences, setSettingPreferences] = useState<string>('');
  const [characterPreferences, setCharacterPreferences] = useState<string>('');
  const [plotPreferences, setPlotPreferences] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [choices, setChoices] = useState<Array<{id: number; text: string}>>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [showSetup, setShowSetup] = useState<boolean>(true);
  const [isChoiceDisabled, setIsChoiceDisabled] = useState<boolean>(false);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [backgroundEffect, setBackgroundEffect] = useState<string>('');

  // Store speech synthesis instance
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const settingOptions = [
    "Medieval Fantasy",
    "Futuristic Sci-Fi",
    "Modern Urban Fantasy",
    "Post-Apocalyptic",
    "Steampunk Victorian",
    "Ancient Mythology",
    "Space Opera",
    "Cyberpunk"
  ];

  const characterOptions = [
    "Heroic Warrior",
    "Mysterious Mage",
    "Clever Rogue",
    "Noble Knight",
    "Wise Sage",
    "Dark Anti-hero",
    "Charismatic Leader",
    "Skilled Archer"
  ];

  const plotOptions = [
    "Epic Quest",
    "Mystery Adventure",
    "Political Intrigue",
    "Monster Hunting",
    "Treasure Hunt",
    "Magical Academy",
    "Dragon Slaying",
    "Kingdom Defense"
  ];

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Function to handle narration
  const handleNarration = () => {
    if (!speechSynthesis) return;

    if (isNarrating) {
      // Stop narration
      speechSynthesis.cancel();
      setIsNarrating(false);
    } else {
      // Prepare the latest response text to narrate
      let textToRead = lastResponse;
      
      // Add current question if it exists
      if (currentQuestion) {
        textToRead += "\n\nQuestion: " + currentQuestion;
      }
      
      // Add choices if they exist
      if (choices.length > 0) {
        textToRead += "\n\nYour choices are:";
        choices.forEach(choice => {
          textToRead += `\nChoice ${choice.id}: ${choice.text}`;
        });
      }

      // Create and configure utterance
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.9; // Slightly slower for better clarity
      utterance.pitch = 1;
      utterance.onend = () => setIsNarrating(false);
      
      // Get available voices and set a good one if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Daniel') || // Windows
        voice.name.includes('Samantha') || // macOS
        voice.name.includes('Google UK English Male') // Chrome
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Handle interruption of current narration
      utterance.onstart = () => {
        setIsNarrating(true);
      };

      utterance.onerror = () => {
        setIsNarrating(false);
        console.error('Speech synthesis error occurred');
      };

      // Split text into sentences for more natural pauses
      const sentences = textToRead.match(/[^.!?]+[.!?]+/g) || [textToRead];
      sentences.forEach((sentence, index) => {
        const sentenceUtterance = new SpeechSynthesisUtterance(sentence.trim());
        sentenceUtterance.voice = preferredVoice || speechSynthesis.getVoices()[0];
        sentenceUtterance.rate = 0.9;
        sentenceUtterance.pitch = 1;
        
        // Only set onend for the last sentence
        if (index === sentences.length - 1) {
          sentenceUtterance.onend = () => setIsNarrating(false);
        }
        
        speechSynthesis.speak(sentenceUtterance);
      });

      setIsNarrating(true);
    }
  };

  // Clean up speech synthesis when component unmounts or when navigating away
  useEffect(() => {
    return () => {
      if (speechSynthesis && isNarrating) {
        speechSynthesis.cancel();
      }
    };
  }, [speechSynthesis, isNarrating]);

  const handleGenerateStory = async () => {
    setIsLoading(true);
    try {
      const storyResult = await generateStoryFromPrompt({
        prompt: prompt,
        settingPreferences: settingPreferences,
        characterPreferences: characterPreferences,
        plotPreferences: plotPreferences,
      });
      
      // Extract question and choices
      const { question, options } = extractQuestionAndChoices(storyResult.story);
      
      // Format the story text without the choices
      const storyText = storyResult.story.replace(/(?:\d+\.\s*|\)\s*|\-\s*)([^\n]+)/g, '');
      setGameText((prev) => prev + storyText + '\n');
      setLastResponse(storyText); // Store the latest response
      setCurrentQuestion(question);
      setGameState(storyResult.story);
      setShowSetup(false);
      
      // Format choices with numbers
      setChoices(options.map((option, index) => ({
        id: index + 1,
        text: option
      })));
      setIsChoiceDisabled(false);
    } catch (error) {
      console.error('Failed to generate story:', error);
      setGameText((prev) => prev + 'Error: Failed to generate story.\n');
      setLastResponse('Error: Failed to generate story.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = async (choice: { id: number; text: string }) => {
    setIsChoiceDisabled(true); // Disable choices while processing
    const choiceText = `\n[Choice ${choice.id}] ${choice.text}\n\n`;
    setGameText((prev) => prev + choiceText);
    
    try {
      const aiResponse = await interpretPlayerCommand({
        command: choice.text,
        gameState: gameState,
      });
      
      // Extract new question and choices
      const { question, options } = extractQuestionAndChoices(aiResponse.narration);
      
      // Format the response text without the choices
      const responseText = aiResponse.narration.replace(/(?:\d+\.\s*|\)\s*|\-\s*)([^\n]+)/g, '');
      setGameText((prev) => prev + responseText + '\n');
      setLastResponse(responseText); // Store the latest response
      setCurrentQuestion(question);
      setGameState(aiResponse.updatedGameState);
      
      // Format new choices with numbers
      setChoices(options.map((option, index) => ({
        id: index + 1,
        text: option
      })));
      setIsChoiceDisabled(false);
    } catch (error) {
      console.error('Failed to process choice:', error);
      const errorText = 'Error: Failed to process choice.\n';
      setGameText((prev) => prev + errorText);
      setLastResponse(errorText);
      setIsChoiceDisabled(false);
    }
  };

  const extractQuestionAndChoices = (text: string): { question: string; options: string[] } => {
    // Split text into lines and clean them
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    let question = '';
    let choices: string[] = [];

    // Find the last question in the text
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].endsWith('?')) {
        question = lines[i];
        break;
      }
    }

    // If we found a question, look for explicit choices after it
    if (question) {
      // First try to find numbered or bulleted choices
      const choiceLines = lines.slice(lines.indexOf(question) + 1);
      const explicitChoices = choiceLines
        .filter(line => line.match(/^(?:\d+\.|\-|\*|\•|\○)\s*/))
        .map(line => line.replace(/^(?:\d+\.|\-|\*|\•|\○)\s*/, '').trim());

      if (explicitChoices.length > 0) {
        choices = explicitChoices;
      } else {
        // If no explicit choices found, try to extract them from the question
        // Example: "Do you A or B?" -> ["A", "B"]
        if (question.toLowerCase().includes(' or ')) {
          const parts = question.split(' or ').map(part => part.trim());
          const lastPart = parts[parts.length - 1].replace('?', '').trim();
          parts[parts.length - 1] = lastPart;
          choices = parts.map(part => {
            // Clean up the choice text
            return part
              .replace(/^do you /i, '')
              .replace(/^would you /i, '')
              .replace(/^should you /i, '')
              .trim();
          });
        }
      }
    }

    // If still no choices found, try to generate them from the context
    if (choices.length === 0 && question) {
      if (question.toLowerCase().includes("dragon's lair")) {
        choices = [
          "Enter the dragon's lair immediately",
          "Explore the surrounding area first"
        ];
      }
      // Add more context-specific choices as needed
    }

    // If we still don't have any choices, provide generic ones
    if (choices.length === 0) {
      if (question) {
        choices = ["Yes", "No", "Wait and observe"];
      }
    }

    return { 
      question: question || "What would you like to do?", 
      options: choices.length > 0 ? choices : ["Continue", "Wait", "Look around"]
    };
  };

  // Auto-scroll to bottom
  useEffect(() => {
    const scrollable = document.getElementById('scrollable-text');
    if (scrollable) {
      scrollable.scrollTop = scrollable.scrollHeight;
    }
  }, [gameText]);

  // Function to get background class based on character type
  const getBackgroundClass = (character: string) => {
    const classMap: { [key: string]: string } = {
      'Mysterious Mage': 'bg-mage',
      'Heroic Warrior': 'bg-warrior',
      'Clever Rogue': 'bg-rogue',
      'Noble Knight': 'bg-knight',
      'Wise Sage': 'bg-sage',
      'Dark Anti-hero': 'bg-antihero',
      'Charismatic Leader': 'bg-leader',
      'Skilled Archer': 'bg-archer'
    };
    return classMap[character] || '';
  };

  // Update background effect when character changes
  useEffect(() => {
    setBackgroundEffect(getBackgroundClass(characterPreferences));
  }, [characterPreferences]);

  // Mouse move effect for certain backgrounds
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--x', `${x}%`);
      document.documentElement.style.setProperty('--y', `${y}%`);
    };

    if (backgroundEffect === 'bg-mage' || backgroundEffect === 'bg-leader') {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [backgroundEffect]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0720] to-[#1a0b2e]">
      {backgroundEffect && <div className={`bg-character-effect ${backgroundEffect}`} />}
      <h1 className="game-title">Quest Weaver</h1>
      
      {showSetup ? (
        <div className="form-container">
          <div className="game-card">
            <div className="space-y-6">
              <div>
                <Input
                  type="text"
                  placeholder="Enter high-level story prompt (e.g., fantasy adventure)"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="story-input"
                />
              </div>
              
              <div>
                <Select
                  value={settingPreferences}
                  onValueChange={setSettingPreferences}
                >
                  <SelectTrigger className="story-select">
                    <SelectValue placeholder="Choose a setting..." />
                  </SelectTrigger>
                  <SelectContent>
                    {settingOptions.map((option) => (
                      <SelectItem 
                        key={option} 
                        value={option}
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={characterPreferences}
                  onValueChange={setCharacterPreferences}
                >
                  <SelectTrigger className="story-select">
                    <SelectValue placeholder="Choose a character type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {characterOptions.map((option) => (
                      <SelectItem 
                        key={option} 
                        value={option}
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={plotPreferences}
                  onValueChange={setPlotPreferences}
                >
                  <SelectTrigger className="story-select">
                    <SelectValue placeholder="Choose a plot type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plotOptions.map((option) => (
                      <SelectItem 
                        key={option} 
                        value={option}
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button 
                onClick={handleGenerateStory} 
                disabled={isLoading}
                className="submit-button"
              >
                {isLoading ? 'Crafting Your Tale...' : 'Begin Your Adventure'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-grow">
            <Card className="h-full rounded-none shadow-none bg-transparent">
              <CardContent className="p-4 h-full">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleNarration}
                    className="narration-button"
                    title={isNarrating ? "Stop Narration" : "Start Narration"}
                  >
                    {isNarrating ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                </div>
                <ScrollArea className="h-[calc(100vh-200px)] w-full">
                  <div id="scrollable-text" className="game-text fade-in whitespace-pre-line">
                    {gameText}
                    {currentQuestion && (
                      <div className="question-highlight">
                        {currentQuestion}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="choices-container">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice)}
                disabled={isChoiceDisabled}
                className="choice-button"
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-600 rounded-full text-white font-bold">
                    {choice.id}
                  </span>
                  <span>{choice.text}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
