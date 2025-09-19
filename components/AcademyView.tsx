import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CourseModule, CourseLesson, UserCourseProgress, LessonBlock, UserSettings, StrategyKey, StrategyLogicData, ApiConfiguration } from '../types.ts';
import { FOUNDATIONAL_MODULES } from '../constants.ts';
import { storeImage, getImage } from '../idb.ts';
import Logo from './Logo.tsx';

interface ExerciseImageProps {
    imageKey: string;
}

const ExerciseImage: React.FC<ExerciseImageProps> = ({ imageKey }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchImage = async () => {
            setIsLoading(true);
            const url = await getImage(imageKey);
            if (isMounted) {
                setImageUrl(url || null);
                setIsLoading(false);
            }
        };

        fetchImage();
        return () => { isMounted = false; };
    }, [imageKey]);

    if (isLoading) {
        return <div className="w-1/2 rounded-md border border-gray-600 bg-gray-700 animate-pulse h-48 flex items-center justify-center">Loading image...</div>;
    }

    if (!imageUrl) {
        return <div className="w-1/2 rounded-md border border-gray-600 bg-gray-800 h-48 flex items-center justify-center">Image not found.</div>;
    }

    return <img src={imageUrl} alt="Submitted exercise" className="w-1/2 rounded-md border border-gray-600" />;
};


interface AcademyViewProps {
    userCourseProgress: UserCourseProgress;
    setUserCourseProgress: React.Dispatch<React.SetStateAction<UserCourseProgress>>;
    apiConfig: ApiConfiguration;
    userSettings: UserSettings;
    strategyLogicData: Record<StrategyKey, StrategyLogicData>;
}

const AcademyView: React.FC<AcademyViewProps> = ({ userCourseProgress, setUserCourseProgress, apiConfig, userSettings, strategyLogicData }) => {
    const [activeView, setActiveView] = useState<'modules' | 'lesson' | 'quiz'>('modules');
    const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
    
    // Quiz State
    const [currentQuizAnswers, setCurrentQuizAnswers] = useState<Record<number, string>>({});
    const [quizResult, setQuizResult] = useState<{ score: number; feedback: string } | null>(null);
    const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

    // Exercise State
    const [isProcessingExercise, setIsProcessingExercise] = useState(false);
    const [exerciseError, setExerciseError] = useState<string | null>(null);
    const exerciseFileRef = useRef<HTMLInputElement>(null);

    const getAiClient = useCallback(() => {
        if (!apiConfig.geminiApiKey) return null;
        return new GoogleGenAI({ apiKey: apiConfig.geminiApiKey });
    }, [apiConfig.geminiApiKey]);


    const handleSelectLesson = (lesson: CourseLesson, module: CourseModule) => {
        setSelectedLesson(lesson);
        setSelectedModule(module);
        setActiveView('lesson');
    };

    const handleMarkLessonComplete = (lessonId: string) => {
        setUserCourseProgress(prev => {
            const newCompleted = new Set([...prev.completedLessons, lessonId]);
            return { ...prev, completedLessons: Array.from(newCompleted) };
        });
        setActiveView('modules');
    };
    
    const handleStartQuiz = (module: CourseModule) => {
        setSelectedModule(module);
        setQuizResult(null);
        setCurrentQuizAnswers({});
        setActiveView('quiz');
    };
    
    const handleAnswerQuestion = (questionIndex: number, answer: string) => {
        setCurrentQuizAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    };

    const handleSubmitQuiz = async () => {
        const ai = getAiClient();
        if (!selectedModule || !ai) {
            alert("API Key not set. Cannot submit quiz for feedback.");
            return;
        }

        setIsSubmittingQuiz(true);

        let correctCount = 0;
        const resultDetails = selectedModule.quiz.map((q, i) => {
            const userAnswer = currentQuizAnswers[i];
            const isCorrect = userAnswer === q.correctAnswer;
            if (isCorrect) correctCount++;
            return `Question ${i + 1}: "${q.question}"\n- User answered: "${userAnswer || 'No answer'}"\n- Correct answer: "${q.correctAnswer}"\n- User was: ${isCorrect ? 'Correct' : 'Incorrect'}`;
        }).join('\n');
        
        const score = Math.round((correctCount / selectedModule.quiz.length) * 100);

        const prompt = `You are an expert trading coach providing feedback on a quiz. The module is "${selectedModule.title}". Here are the user's results:\n\n${resultDetails}\n\nYour task is to provide a concise, encouraging, and helpful summary. Address the user directly. Start with their score. Then, briefly highlight what they seem to understand well and what topics they should review. Frame it positively. Do not repeat the questions or answers. Keep it under 150 words.`;
        
        let feedback = "Quiz submitted! Check your score and feedback below.";
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const responseText = response.text;
            feedback = responseText ?? "Could not generate feedback.";
        } catch (err) {
            console.error("Error getting quiz feedback from AI:", err);
            feedback = "There was an error generating feedback. Please check your API key and try again.";
        } finally {
            setQuizResult({ score, feedback });
            setUserCourseProgress(prev => ({
                ...prev,
                quizScores: {
                    ...prev.quizScores,
                    [selectedModule.id]: score
                }
            }));
            setIsSubmittingQuiz(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, block: LessonBlock, lessonId: string, blockIndex: number) => {
        if (block.type !== 'exercise' || !e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) return;

            setIsProcessingExercise(true);
            setExerciseError(null);
            
            try {
                const imageKey = await storeImage(dataUrl);
                 setUserCourseProgress(prev => ({
                    ...prev,
                    exerciseStates: {
                        ...prev.exerciseStates,
                        [`${lessonId}-${blockIndex}`]: { imageKey, status: 'pending' }
                    }
                }));

                const ai = getAiClient();
                if (!ai) {
                    throw new Error("API Key is not available.");
                }

                const prefixMatch = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,/);
                if (!prefixMatch) throw new Error("Invalid image format.");
                const mimeType = prefixMatch[1];
                const data = dataUrl.substring(prefixMatch[0].length);

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [
                        { inlineData: { mimeType, data } },
                    ],
                    config: {
                         systemInstruction: block.validationPrompt,
                    }
                });
                
                const feedbackText = response.text;
                const passed = (feedbackText ?? '').toUpperCase().startsWith('PASS:');

                setUserCourseProgress(prev => ({
                    ...prev,
                    exerciseStates: {
                        ...prev.exerciseStates,
                        [`${lessonId}-${blockIndex}`]: { 
                            imageKey, 
                            status: passed ? 'passed' : 'failed', 
                            feedback: feedbackText || 'No feedback was returned.'
                        }
                    }
                }));

            } catch (err) {
                 const message = err instanceof Error ? err.message : "An unknown error occurred.";
                 setExerciseError(`AI Validation Error: ${message}`);
                 setUserCourseProgress(prev => ({
                    ...prev,
                    exerciseStates: {
                        ...prev.exerciseStates,
                        [`${lessonId}-${blockIndex}`]: { status: 'failed', feedback: `Error: ${message}` }
                    }
                }));
            } finally {
                setIsProcessingExercise(false);
            }
        };

        reader.readAsDataURL(file);
        e.target.value = ''; // Reset file input
    };

    const isModuleComplete = (module: CourseModule) => {
        const completedInModule = module.lessons.filter(l => userCourseProgress.completedLessons.includes(l.id)).length;
        return completedInModule === module.lessons.length;
    };

    const customCourses = useMemo(() => {
        return Object.values(strategyLogicData)
            .filter(strat => strat.isEnabled && strat.courseModule)
            .map(strat => strat.courseModule!);
    }, [strategyLogicData]);

    const sections = [
        { title: 'Foundational Modules', modules: FOUNDATIONAL_MODULES },
        { title: 'Your Custom Strategy Courses', modules: customCourses }
    ];
    
    return (
        <div className="p-4 md:p-6 space-y-6 mx-auto max-w-7xl">
            {activeView === 'modules' && (
                 <div>
                    <div className="text-center mb-8">
                        <h2 className="font-bold text-white" style={{ fontSize: `${userSettings.headingFontSize + 12}px` }}>Chart Oracle Academy</h2>
                        <p className="text-gray-400 mt-1" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Master the art of technical analysis, from foundational concepts to advanced strategies.</p>
                    </div>
                     {sections.map(section => (
                         <div key={section.title} className="mb-8">
                            <h3 className="font-semibold text-white mb-4 border-b-2 border-yellow-500 pb-2" style={{ fontSize: `${userSettings.headingFontSize + 4}px` }}>{section.title}</h3>
                             {section.modules.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {section.modules.map(module => {
                                        const progress = module.lessons.length > 0 ? Math.round((module.lessons.filter(l => userCourseProgress.completedLessons.includes(l.id)).length / module.lessons.length) * 100) : 0;
                                        const quizScore = userCourseProgress.quizScores[module.id];
                                        const canTakeQuiz = isModuleComplete(module);

                                        return (
                                            <div key={module.id} className="bg-gray-800 rounded-lg p-5 border border-gray-700 flex flex-col">
                                                <h4 className="font-bold text-yellow-400" style={{ fontSize: `${userSettings.headingFontSize}px` }}>{module.title}</h4>
                                                <p className="text-sm text-gray-400 mt-1 flex-grow">{module.description}</p>
                                                <div className="my-4">
                                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                        <span>Lesson Progress</span>
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                                                </div>
                                                <ul className="space-y-2 text-sm">
                                                    {module.lessons.map(lesson => (
                                                        <li key={lesson.id}>
                                                            <button onClick={() => handleSelectLesson(lesson, module)} className="flex items-center space-x-2 text-gray-300 hover:text-yellow-300 w-full text-left">
                                                                {userCourseProgress.completedLessons.includes(lesson.id) ? 
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> :
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                                                }
                                                                <span>{lesson.title} <span className="text-gray-500">({lesson.estimatedTime})</span></span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-4 pt-4 border-t border-gray-700/50">
                                                    {quizScore !== undefined ? (
                                                        <div className="text-center">
                                                            <p className="font-semibold text-sm">Quiz Score: <span className={`font-bold ${quizScore >= 70 ? 'text-green-400' : 'text-red-400'}`}>{quizScore}%</span></p>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => handleStartQuiz(module)} disabled={!canTakeQuiz} className="w-full font-semibold py-2 px-4 rounded-md bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                                                            {canTakeQuiz ? 'Take Quiz' : 'Complete Lessons to Unlock Quiz'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                             ) : (
                                <div className="text-center bg-gray-800/50 rounded-lg py-12">
                                    <p className="text-gray-500" style={{ fontSize: `${userSettings.uiFontSize}px` }}>Create a new strategy from a knowledge source in Master Controls to see your custom courses here.</p>
                                </div>
                             )}
                         </div>
                     ))}
                 </div>
            )}

            {activeView === 'lesson' && selectedLesson && (
                <div>
                    <button onClick={() => setActiveView('modules')} className="text-sm text-yellow-400 font-semibold mb-4">&larr; Back to Modules</button>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h2 className="font-bold text-white mb-1" style={{ fontSize: `${userSettings.headingFontSize + 4}px` }}>{selectedLesson.title}</h2>
                        <p className="text-gray-500 mb-6 text-sm">From Module: {selectedModule?.title}</p>
                        
                        <div className="prose prose-invert max-w-none prose-strong:text-yellow-300" style={{ fontSize: `${userSettings.uiFontSize}px` }}>
                            {selectedLesson.blocks.map((block, index) => {
                                const exerciseState = userCourseProgress.exerciseStates[`${selectedLesson.id}-${index}`];
                                return (
                                <div key={index} className="mb-6 p-4 border-l-4 border-gray-700">
                                    <div dangerouslySetInnerHTML={{ __html: block.type === 'text' ? block.content : block.prompt }} />

                                    {block.type === 'exercise' && (
                                        <div className="mt-4 bg-gray-900/50 p-4 rounded-md border border-gray-600">
                                            {exerciseState?.status === 'pending' || isProcessingExercise ? (
                                                <div className="flex items-center gap-3"><Logo className="w-8 h-8" isLoading={true} /><p className="text-yellow-300">Evaluating your submission...</p></div>
                                            ) : exerciseState?.feedback ? (
                                                 <div className={`p-3 rounded-md border ${exerciseState.status === 'passed' ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                                                     <p className={`font-bold ${exerciseState.status === 'passed' ? 'text-green-300' : 'text-red-300'}`}>{exerciseState.status === 'passed' ? 'Evaluation: Correct!' : 'Evaluation: Needs Improvement'}</p>
                                                     <p className="text-sm mt-1">{exerciseState.feedback}</p>
                                                 </div>
                                            ) : null}

                                             {exerciseState?.imageKey && <div className="mt-4 flex justify-center"><ExerciseImage imageKey={exerciseState.imageKey} /></div>}

                                             {exerciseState?.status !== 'passed' && (
                                                 <div className="mt-4">
                                                     <input type="file" ref={exerciseFileRef} onChange={(e) => handleFileSelect(e, block, selectedLesson.id, index)} accept="image/*" className="hidden" />
                                                     <button onClick={() => exerciseFileRef.current?.click()} className="font-semibold py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors" disabled={isProcessingExercise}>
                                                         Upload Chart Screenshot
                                                     </button>
                                                     {exerciseError && <p className="text-red-400 text-sm mt-2">{exerciseError}</p>}
                                                 </div>
                                             )}
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                        <button onClick={() => handleMarkLessonComplete(selectedLesson.id)} className="w-full mt-6 font-bold py-2 px-6 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors">
                            Mark as Complete & Go to Next
                        </button>
                    </div>
                </div>
            )}
            
            {activeView === 'quiz' && selectedModule && (
                <div>
                    <button onClick={() => setActiveView('modules')} className="text-sm text-yellow-400 font-semibold mb-4">&larr; Back to Modules</button>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h2 className="text-2xl font-bold text-white mb-1">Quiz: {selectedModule.title}</h2>
                        <p className="text-gray-500 mb-6">Test your knowledge on the concepts from this module.</p>
                        
                        {!quizResult ? (
                            <div className="space-y-6">
                                {selectedModule.quiz.map((q, index) => (
                                    <div key={index}>
                                        <p className="font-semibold text-gray-200 mb-2">{index + 1}. {q.question}</p>
                                        <div className="space-y-2">
                                            {q.options.map(option => (
                                                <label key={option} className={`block p-3 rounded-md border transition-colors cursor-pointer ${currentQuizAnswers[index] === option ? 'bg-blue-500/20 border-blue-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'}`}>
                                                    <input type="radio" name={`q-${index}`} value={option} checked={currentQuizAnswers[index] === option} onChange={() => handleAnswerQuestion(index, option)} className="mr-2 accent-yellow-400" />
                                                    {option}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleSubmitQuiz} disabled={isSubmittingQuiz} className="w-full mt-6 font-bold py-2 px-6 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors disabled:bg-gray-600">
                                    {isSubmittingQuiz ? 'Submitting...' : 'Submit Answers'}
                                </button>
                            </div>
                        ) : (
                             <div className="text-center">
                                <h3 className={`text-4xl font-bold ${quizResult.score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{quizResult.score}%</h3>
                                <p className="font-semibold text-white">Your Score</p>
                                <div className="mt-6 text-left bg-gray-900/50 p-4 rounded-md border border-gray-600">
                                    <h4 className="font-bold text-yellow-400 mb-2">Oracle's Feedback</h4>
                                    <p className="text-gray-300 whitespace-pre-wrap">{quizResult.feedback}</p>
                                </div>
                                <button onClick={() => setActiveView('modules')} className="mt-6 font-bold py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                                    Back to Modules
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademyView;