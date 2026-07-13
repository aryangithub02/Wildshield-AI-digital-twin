import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

const TOUR_STEPS = {
  en: [
    {
      targetId: "tour-sidebar",
      title: "WildShield AI Sidebar Menu",
      desc: "Quickly switch views. Monitor your farm map overview, check live AI camera feeds, view hardware specs, or adjust system configurations."
    },
    {
      targetId: "tour-navbar",
      title: "Top Navigation Bar",
      desc: "Displays active title header, live clock, regional weather (essential for planning), and the translation language selector dropdown."
    },
    {
      targetId: "tour-kpis",
      title: "Real-Time KPI Metrics",
      desc: "Check key performance metrics at a glance, including total online cameras, active detections, threat alarms, mesh node health, and coverage area."
    },
    {
      targetId: "tour-map",
      title: "Demo Farm Map",
      desc: "Visualizes your pentagonal geofence boundaries. Look! The system has detected an intrusion at Node 01 (FN-1) and is transmitting signals to the Central AI Hub."
    },
    {
      targetId: "tour-camera",
      title: "Current Threat Detection",
      desc: "Displays the active live crop threat breach (e.g. Elephant) with classified confidence scores, threat level, entry time, and thermal graphics."
    },
    {
      targetId: "tour-analytics",
      title: "AI Detection & Alerts Analytics",
      desc: "Provides weekly statistical sparklines mapping total AI triggers, critical alerts generated, and smart deterrent actions taken over the past 7 days."
    },
    {
      targetId: "tour-timeline",
      title: "Event Timeline",
      desc: "Records chronological logs of when motion warnings triggered, which smart deterrents activated (like Speaker or Siren), and when the animal was repelled."
    },
    {
      targetId: "tour-devices",
      title: "IoT Nodes Hardware Status",
      desc: "Displays hardware status of your 5 perimeter sensor nodes and Central Orin Nano Hub, including solar charging levels and transmission load."
    }
  ],
  hi: [
    {
      targetId: "tour-sidebar",
      title: "वाइल्डशील्ड एआई साइडबार मेनू",
      desc: "विभिन्न व्यूज में स्विच करें। अपने डिजिटल ट्विन मैप को देखें, लाइव AI कैमरा फीड चेक करें, सर्किट आरेख देखें या सिस्टम सेटिंग्स बदलें।"
    },
    {
      targetId: "tour-navbar",
      title: "शीर्ष नेविगेशन बार (Top Navigation Bar)",
      desc: "इसमें लाइव घड़ी, मौसम का हाल, सूचना संकेतक और क्षेत्रीय भाषा (हिंदी/मराठी) बदलने का विकल्प शामिल है।"
    },
    {
      targetId: "tour-kpis",
      title: "वास्तविक समय केपीआई मेट्रिक्स",
      desc: "मुख्य प्रदर्शन मेट्रिक्स को एक नज़र में देखें, जिसमें कुल ऑनलाइन कैमरे, सक्रिय पहचान, खतरे के अलार्म और कवरेज क्षेत्र शामिल हैं।"
    },
    {
      targetId: "tour-map",
      title: "कृषि नक्शा (Demo Farm Map)",
      desc: "आपकी सुरक्षा सीमा को दिखाता है। देखिए! नोड 01 (FN-1) पर हाथी की हलचल पहचानी है और सेंट्रल हब को सिग्नल भेज रहा है।"
    },
    {
      targetId: "tour-camera",
      title: "वर्तमान खतरे की पहचान",
      desc: "दिखाता है कि किस जानवर (जैसे हाथी) ने सीमा पार की है, एआई मॉडल का सटीकता प्रतिशत और खतरे का स्तर क्या है।"
    },
    {
      targetId: "tour-analytics",
      title: "एी पहचान और अलर्ट विश्लेषण",
      desc: "पिछले 7 दिनों में कुल एआई ट्रिगर्स, उत्पन्न गंभीर अलर्ट और की गई निवारक कार्रवाइयों का साप्ताहिक सांख्यिकीय ग्राफ़ प्रदान करता है।"
    },
    {
      targetId: "tour-timeline",
      title: "समयरेखा (Event Timeline)",
      desc: "जानवरों को भगाने के लिए सायरन या पानी के बौछार चालू करता है, और उनके वापस सुरक्षित चले जाने का समय रिकॉर्ड करता है।"
    },
    {
      targetId: "tour-devices",
      title: "IoT नोड्स हार्डवेयर स्थिति",
      desc: "आपके 5 पेरिफेरल सेंसर नोड्स और सेंट्रल ओरिन नैनो हब की हार्डवेयर स्थिति दिखाता है, जिसमें सौर चार्जिंग स्तर और ट्रांसमिशन लोड शामिल हैं।"
    }
  ],
  mr: [
    {
      targetId: "tour-sidebar",
      title: "वाइल्डशील्ड एआई साइडबार मेनू",
      desc: "विविध स्क्रीनवर स्विच करा. शेत नकाशा तपासा, थेट AI कॅमेरा फीड पहा, वायरिंग सर्किट आकृती तपासा किंवा सिस्टम सेटिंग्ज बदला."
    },
    {
      targetId: "tour-navbar",
      title: "शीर्ष नेव्हिगेशन बार (Top Navigation Bar)",
      desc: "यामध्ये लाइव्ह घड्याळ, हवामानाचा अंदाज, सूचना आणि प्रादेशिक भाषा बदलण्याची सुविधा समाविष्ट आहे."
    },
    {
      targetId: "tour-kpis",
      title: "रिअल-टाइम केपीआय मेट्रिक्स",
      desc: "मुख्य कार्यप्रदर्शन मेट्रिक्स एका दृष्टीक्षेपात तपासा, ज्यामध्ये एकूण ऑनलाइन कॅमेरे, सक्रिय शोध, धोक्याचे अलार्म आणि कव्हरेज क्षेत्र समाविष्ट आहे."
    },
    {
      targetId: "tour-map",
      title: "शेत नकाशा (Demo Farm Map)",
      desc: "तुमच्या शेताची सुरक्षा सीमा दर्शवतो. पहा! सिस्टमने नोड 01 (FN-1) वर हत्तीची घुसखोरी शोधली असून सेंट्रल हबला सिग्नल पाठवला आहे."
    },
    {
      targetId: "tour-camera",
      title: "सध्याचा धोक्याचा शोध",
      desc: "घुसखोरी केलेल्या प्राण्याचे नाव (उदा. हत्ती), एआय मॉडेलची अचूकता टक्केवारी आणि धोक्याची पातळी रिअल-टाइममध्ये दर्शवतो."
    },
    {
      targetId: "tour-analytics",
      title: "एआय शोध आणि अलर्ट विश्लेषण",
      desc: "गेल्या ७ दिवसांत एकूण एआय ट्रिगर्स, जनरेट केलेले गंभीर अलर्ट आणि घेतलेल्या प्रतिबंधात्मक कृतींचा साप्ताहिक सांख्यिकीय आलेख प्रदान करतो."
    },
    {
      targetId: "tour-timeline",
      title: "घटनांची नोंद (Event Timeline)",
      desc: "प्राण्यांना पळवण्यासाठी सायरन किंवा पाण्याचे पंप आपोआप सुरू करतो आणि प्राणी सुरक्षितपणे परत गेल्याची वेळ नोंदवतो."
    },
    {
      targetId: "tour-devices",
      title: "IoT नोड्स हार्डवेअर स्थिती",
      desc: "तुमच्या ५ पेरिफेरल सेन्सर नोड्स आणि्रल ओरिन नॅनो हबची हार्डवेअर स्थिती दर्शवते, ज्यामध्ये सोलर चार्जिंग पातळी आणि ट्रान्समिशन लोड समाविष्ट आहे."
    }
  ]
};

const InteractiveTour = forwardRef(({ language = 'en', onStart, onStepChange, onComplete }, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const [highlightStyle, setHighlightStyle] = useState({ opacity: 0 });
  const [popoverStyle, setPopoverStyle] = useState({
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    position: 'fixed'
  });

  const timerRef = useRef(null);
  const stepStartTimeRef = useRef(Date.now());
  const steps = TOUR_STEPS[language] || TOUR_STEPS['en'];
  const STEP_DURATION = 5000; // 5 seconds per step (25 seconds total)

  // Show the tour when the website loads
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenWildshieldTour');
    if (!hasSeenTour) {
      setIsVisible(true);
      if (onStart) onStart();
    }
  }, [onStart]);

  // Sync simulation step state in App.jsx
  useEffect(() => {
    if (isVisible && onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, isVisible, onStepChange]);

  // Expose restartTour to parent ref
  useImperativeHandle(ref, () => ({
    restartTour: () => {
      setCurrentStep(0);
      setProgress(0);
      setIsPlaying(true);
      setIsVisible(true);
      if (onStart) onStart();
    }
  }));

  const restartTour = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
    setIsVisible(true);
    if (onStart) onStart();
  };

  // Update highlight dimensions and popover positioning based on active target ID
  useEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      const activeStep = steps[currentStep];
      if (!activeStep) return;

      const element = document.getElementById(activeStep.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        // Setup border highlight around element using position: 'fixed' (viewport relative)
        setHighlightStyle({
          opacity: 1,
          position: 'fixed',
          left: `${rect.left - 8}px`,
          top: `${rect.top - 8}px`,
          width: `${rect.width + 16}px`,
          height: `${rect.height + 16}px`,
        });

        // Setup popover position
        let popTop = rect.top + rect.height + 16;
        let popLeft = rect.left + rect.width / 2;
        let transform = 'translateX(-50%)';

        // Custom offsets for large structural layouts
        if (activeStep.targetId === 'tour-sidebar' || rect.height > window.innerHeight * 0.7) {
          // Position popover card to the right of the sidebar, centered vertically
          popLeft = rect.left + rect.width + 160;
          popTop = Math.max(80, window.innerHeight / 2 - 90);
        } else if (activeStep.targetId === 'tour-navbar') {
          // Position popover card directly below the top navigation bar
          popTop = rect.top + rect.height + 16;
          popLeft = rect.left + rect.width / 2;
        } else {
          // General elements: default below target, swap to above if overflowing bottom
          if (popTop + 200 > window.innerHeight) {
            popTop = rect.top - 210;
          }
        }

        // Clamp popTop to stay within screen boundaries
        if (popTop < 16) {
          popTop = 16;
        } else if (popTop + 200 > window.innerHeight) {
          popTop = window.innerHeight - 216;
        }

        // Clamp popLeft to stay within screen boundaries
        if (popLeft - 160 < 16) {
          popLeft = 176;
        } else if (popLeft + 160 > window.innerWidth - 16) {
          popLeft = window.innerWidth - 176;
        }

        setPopoverStyle({
          position: 'fixed',
          top: `${popTop}px`,
          left: `${popLeft}px`,
          transform
        });
      } else {
        // Centered fallback if element is not in DOM
        setHighlightStyle({ opacity: 0 });
        setPopoverStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        });
      }
    };

    // Scroll the target element into center viewport smoothly
    const activeStep = steps[currentStep];
    if (activeStep) {
      const element = document.getElementById(activeStep.targetId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }

    // Run position calculations repeatedly during smooth scrolls
    updatePosition();
    const interval = setInterval(updatePosition, 80);
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 850);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, isVisible, language, steps]);

  // Reset progress bar and step timer on step change (ensures no race conditions when advancing)
  useEffect(() => {
    setProgress(0);
    stepStartTimeRef.current = Date.now();
  }, [currentStep]);

  // Handle Autoplay simulation timeline loop
  useEffect(() => {
    if (!isVisible) return;

    let autoplayTimer = null;

    if (isPlaying) {
      // Reset start time on play toggle
      stepStartTimeRef.current = Date.now();
      setProgress(0);

      autoplayTimer = setInterval(() => {
        const elapsed = Date.now() - stepStartTimeRef.current;
        const currentProgress = Math.min(100, (elapsed / STEP_DURATION) * 100);

        setProgress(currentProgress);

        if (elapsed >= STEP_DURATION) {
          // Reset start time synchronously inside callback before updating state
          stepStartTimeRef.current = Date.now();
          setProgress(0);

          setCurrentStep((prevStep) => {
            if (prevStep >= steps.length - 1) {
              handleComplete();
              return prevStep;
            }
            return prevStep + 1;
          });
        }
      }, 50);
    }

    return () => {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
      }
    };
  }, [isPlaying, isVisible, steps, STEP_DURATION]);

  const handleNext = () => {
    setProgress(0);
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenWildshieldTour', 'true');
    if (onComplete) onComplete();
  };

  if (!isVisible) {
    return (
      <button 
        onClick={restartTour}
        className="fixed bottom-4 right-4 z-40 bg-slate-950/85 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-green-500 rounded-full h-8.5 w-8.5 flex items-center justify-center shadow-2xl transition-all"
        title="Start Platform Walkthrough Tour"
      >
        <HelpCircle className="h-4.5 w-4.5 animate-pulse" />
      </button>
    );
  }

  const activeStepObj = steps[currentStep] || steps[0];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none font-sans">
      
      {/* 1. Translucent dim backdrop (Only lets target element highlights through) */}
      <div className="absolute inset-0 bg-slate-950/45 pointer-events-auto" />

      {/* 2. Target Component Border Highlight overlay */}
      <AnimatePresence>
        {highlightStyle.opacity === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={highlightStyle}
            className="absolute border-2 border-green-500 rounded-xl shadow-[0_0_25px_rgba(34,197,94,0.35)] pointer-events-none"
          >
            {/* Top-Right Tag */}
            <div className="absolute -top-3.5 -right-3 bg-green-500 text-slate-950 text-[7px] font-extrabold px-1 rounded-sm tracking-widest uppercase">
              ACTIVE GUIDE
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Guided Tour Info Card */}
      <div 
        style={popoverStyle}
        className="w-72 bg-[#0b0f19]/90 border border-slate-900 rounded-xl shadow-2xl p-4 pointer-events-auto space-y-3 z-50 backdrop-blur-md"
      >
        {/* Title & Skip */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Walkthrough • {currentStep + 1} / {steps.length}
          </span>
          <button 
            onClick={handleComplete}
            className="text-[8px] font-mono font-bold text-slate-500 hover:text-slate-200 uppercase tracking-wider"
          >
            Skip
          </button>
        </div>

        {/* Progress Timeline bar */}
        <div className="h-0.5 w-full bg-slate-950 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-[50ms]" 
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Text descriptions */}
        <div className="text-left space-y-1">
          <h4 className="text-xs font-bold text-slate-100 font-sans tracking-tight">
            {activeStepObj.title}
          </h4>
          <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
            {activeStepObj.desc}
          </p>
        </div>

        {/* Control bar */}
        <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[9px] font-mono">
          
          {/* Pause / Play */}
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-slate-400 hover:text-white flex items-center gap-1"
          >
            {isPlaying ? (
              <><Pause className="h-3 w-3" /><span>Pause</span></>
            ) : (
              <><Play className="h-3 w-3" /><span>AutoPlay</span></>
            )}
          </button>

          {/* Steppers */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrev} 
              disabled={currentStep === 0}
              className={`p-1 bg-slate-950 border border-slate-900 rounded ${
                currentStep === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-white text-slate-400'
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={handleNext}
              className="p-1 bg-slate-950 border border-slate-900 rounded hover:text-white text-slate-400"
            >
              {currentStep === steps.length - 1 ? (
                <SkipForward className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
});

export default InteractiveTour;
