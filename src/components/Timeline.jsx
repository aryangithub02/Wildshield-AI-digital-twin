import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, AlertTriangle, Volume2, Lightbulb, CheckCircle2 } from 'lucide-react';
import { getTranslation } from '../utils/translations';

// Localization helper for dynamic simulation logs containing node coordinates or species names
export const getLocalizedLogText = (language, log, t) => {
  if (typeof log === 'string') return log;
  if (!log.key) return log.text || '';

  const key = log.key;
  const params = log.params || {};

  // Get species translation if present
  let speciesTrans = params.species;
  if (params.species) {
    const spLower = params.species.toLowerCase();
    if (spLower === 'elephant') speciesTrans = t('elephant');
    else if (spLower === 'wild boar') speciesTrans = t('wildBoar');
    else if (spLower === 'monkey') speciesTrans = t('monkey');
    else if (spLower === 'deer') speciesTrans = t('deer');
    else if (spLower === 'nilgai') speciesTrans = t('nilgai');
  }

  // Get threat translation if present
  let threatTrans = params.threat;
  if (params.threat) {
    if (params.threat === 'HIGH') threatTrans = t('high').toUpperCase();
    else if (params.threat === 'MEDIUM') threatTrans = t('medium').toUpperCase();
    else threatTrans = t('low').toUpperCase();
  }

  // Get actuators list translated
  let actuatorsTrans = '';
  if (Array.isArray(params.actuators)) {
    const translatedList = params.actuators.map(act => {
      if (act === "Predator Sound") return t('speakerOn').replace("📢 ", "");
      if (act === "Sprinkler Pump") return t('sirenActivated').replace(" Activated", "");
      if (act === "Ultrasonic Siren") return t('sirenActive').replace("📢 ", "");
      if (act === "Floodlight 01") return t('floodLight');
      return act;
    });
    
    if (language === 'hi' || language === 'mr') {
      actuatorsTrans = translatedList.join(" और ");
    } else {
      actuatorsTrans = translatedList.join(" & ");
    }
  }

  // Dictionary templates
  const templates = {
    en: {
      coreOnline: "WildShield Core Network Online",
      hubConnected: "Central AI Hub (Jetson Orin Nano) connected",
      meshCalibrated: "ESP32 Mesh geofence calibration complete",
      systemIdle: "System returned to standard monitoring state. All devices on standby.",
      motionDetectedLog: `PIR Sensor on ${params.nodeName} detects motion. Sending wake-up trigger to ESP32.`,
      cameraActivatedLog: `${params.nodeName} wakes IP Camera. Transmitting 1080p stream over LoRa SX1278 to Central AI Hub.`,
      targetConfirmedLog: `Central AI Hub confirmed: ${speciesTrans} (Confidence rising). Threat level: ${threatTrans}.`,
      stage1DeployLog: `${params.nodeName} deploying Stage 1 Deterrence: ${actuatorsTrans} activated.`,
      stage2DeployLog: `Threat persists. ${params.nodeName} deploying Stage 2 Deterrence: ${actuatorsTrans} active.`,
      targetRepelledLog: `Target repelled: ${speciesTrans} retreated past PIR range at ${params.nodeName}.`,
      manualReset: "Simulation manual reset. Monitoring standard perimeter.",
      systemInitialized: "System initialized to IDLE."
    },
    hi: {
      coreOnline: "वाइल्डशील्ड कोर नेटवर्क ऑनलाइन",
      hubConnected: "सेंट्रल एआई हब (जेटसन ओरिन नैनो) कनेक्टेड",
      meshCalibrated: "ESP32 मेश भू-सुरक्षा अंशांकन पूर्ण",
      systemIdle: "सिस्टम मानक निगरानी स्थिति में आ गया है। सभी उपकरण स्टैंडबाय पर हैं।",
      motionDetectedLog: `${params.nodeName} पर लगे पीआईआर सेंसर ने हलचल का पता लगाया। ESP32 को वेक-अप ट्रिगर भेजा जा रहा है।`,
      cameraActivatedLog: `${params.nodeName} ने आईपी कैमरा सक्रिय किया। सेंट्रल एआई हब को LoRa SX1278 द्वारा 1080p स्ट्रीम भेजी जा रही है।`,
      targetConfirmedLog: `सेंट्रल एआई हब ने पुष्टि की: ${speciesTrans} (सटीकता बढ़ रही है)। खतरे का स्तर: ${threatTrans}।`,
      stage1DeployLog: `${params.nodeName} चरण 1 निवारक तैनात कर रहा है: ${actuatorsTrans} सक्रिय।`,
      stage2DeployLog: `खतरा बना हुआ है। ${params.nodeName} चरण 2 निवारक तैनात कर रहा है: ${actuatorsTrans} सक्रिय।`,
      targetRepelledLog: `लक्ष्य खदेड़ दिया गया: ${speciesTrans} ${params.nodeName} पर पीआईआर सीमा से बाहर चला गया।`,
      manualReset: "सिमुलेशन मैनुअल रीसेट। मानक परिधि की निगरानी।",
      systemInitialized: "सिस्टम निष्क्रिय (IDLE) स्थिति में प्रारंभ हुआ।"
    },
    mr: {
      coreOnline: "वाइल्डशील्ड कोर नेटवर्क ऑनलाइन",
      hubConnected: "सेंट्रल एआय हब (जेटसन ओरिन नॅनो) कनेक्टेड",
      meshCalibrated: "ESP32 मेश भू-संरक्षण कॅलिब्रेशन पूर्ण",
      systemIdle: "सिस्टम मानक निरीक्षण स्थितीवर परत आला आहे. सर्व उपकरणे स्टँडबायवर आहेत.",
      motionDetectedLog: `${params.nodeName} वरील पीआयआर सेन्सरने हालचाल शोधली. ESP32 ला वेक-अप ट्रिगर पाठवत आहे.`,
      cameraActivatedLog: `${params.nodeName} ने आयपी कॅमेरा सक्रिय केला.्रल एआय हबला LoRa SX1278 द्वारे 1080p स्ट्रीम पाठवत आहे.`,
      targetConfirmedLog: `सेंट्रल एआय हबने पुष्टी केली: ${speciesTrans} (विश्वासार्हता वाढत आहे). धोक्याची पातळी: ${threatTrans}.`,
      stage1DeployLog: `${params.nodeName} टप्पा 1 प्रतिबंधक तैनात करत आहे: ${actuatorsTrans} सक्रिय.`,
      stage2DeployLog: `धोका कायम आहे. ${params.nodeName} टप्पा 2 प्रतिबंधक तैनात करत आहे: ${actuatorsTrans} सक्रिय.`,
      targetRepelledLog: `लक्ष्य पळवून लावले: ${speciesTrans} ${params.nodeName} वर पीआयआर मर्यादेबाहेर गेला.`,
      manualReset: "सिम्युलेशन मॅन्युअल रीसेट. मानक परिक्षेत्राचे निरीक्षण.",
      systemInitialized: "सिस्टम निष्क्रिय (IDLE) स्थितीत सुरू झाला."
    }
  };

  return templates[language]?.[key] || templates['en']?.[key] || log.text || key;
};

export default function Timeline({ logs, language }) {
  const t = (key) => getTranslation(language, key);

  const getLogIcon = (type) => {
    switch (type) {
      case 'info':
        return <Terminal className="h-3.5 w-3.5 text-blue-400" />;
      case 'detection':
        return <Shield className="h-3.5 w-3.5 text-amber-400" />;
      case 'warning':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'danger':
        return <Volume2 className="h-3.5 w-3.5 text-red-400" />;
      case 'deterrent':
        return <Lightbulb className="h-3.5 w-3.5 text-amber-300" />;
      case 'success':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />;
      default:
        return <Terminal className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getLogDotColors = (type) => {
    switch (type) {
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'detection':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'warning':
        return 'bg-amber-600/15 border-amber-600/30';
      case 'danger':
        return 'bg-red-500/20 border-red-500/30';
      case 'deterrent':
        return 'bg-amber-400/15 border-amber-400/30';
      case 'success':
        return 'bg-green-500/20 border-green-500/30';
      default:
        return 'bg-slate-900 border-slate-800';
    }
  };

  const getThreatLabel = (type) => {
    switch (type) {
      case 'info':
        return { label: 'Info', className: 'bg-blue-500/10 border-blue-500/20 text-blue-400' };
      case 'detection':
        return { label: t('active'), className: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
      case 'warning':
        return { label: t('medium'), className: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
      case 'danger':
        return { label: `♦ ${t('high')}`, className: 'bg-red-500/10 border-red-500/20 text-red-400 font-bold' };
      case 'deterrent':
        return { label: 'Deterrent', className: 'bg-amber-400/10 border-amber-400/20 text-amber-300' };
      case 'success':
        return { label: 'Success', className: 'bg-green-500/10 border-green-500/20 text-green-400' };
      default:
        return { label: 'Log', className: 'bg-slate-950 border-slate-900 text-slate-400' };
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg flex flex-col h-[270px] select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2">
        <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider">{t('timeline')}</span>
        <span className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">{t('viewAll')}</span>
      </div>

      {/* Events Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 italic text-[10px] font-mono">
              No active events logged.
            </div>
          ) : (
            logs.map((log) => {
              const threatInfo = getThreatLabel(log.type);
              const localizedText = getLocalizedLogText(language, log, t);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-4 text-xs group"
                >
                  {/* Time column */}
                  <span className="w-16 text-[10px] font-mono text-slate-500 pt-0.5 whitespace-nowrap text-left">
                    {log.time}
                  </span>

                  {/* Vertical connector line & Dot */}
                  <div className="relative flex flex-col items-center flex-shrink-0 pt-0.5">
                    <div className={`h-7 w-7 rounded-full border flex items-center justify-center ${getLogDotColors(log.type)}`}>
                      {getLogIcon(log.type)}
                    </div>
                  </div>

                  {/* Detail column */}
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-200 font-sans tracking-tight">{localizedText}</p>
                    <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                      {log.type === 'danger' ? 'AI Model: Target Intrusion Alert v2.4' : 'AI Model: Motion Detection v1.3'}
                    </p>
                  </div>

                  {/* Threat status pill */}
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-mono border ${threatInfo.className}`}>
                      {threatInfo.label}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
