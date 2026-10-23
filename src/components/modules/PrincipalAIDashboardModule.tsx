import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  LayoutDashboard,
  Bot,
  Sparkles,
  TrendingUp,
  Users,
  CreditCard,
  GraduationCap,
  Send,
  ShieldCheck,
  CalendarCheck,
  BookOpen,
  FileQuestion,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Check,
  Download,
  AlertCircle,
  FileText,
  Copy,
  Printer,
  Wand2,
  AlertTriangle,
  BrainCircuit,
  MessageSquare,
  Flame,
  Bus,
  ShoppingBag,
  DollarSign,
  Calendar,
  Layers,
  Globe,
  Compass,
  PhoneCall,
  UserPlus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

export const PrincipalAIDashboardModule: React.FC = () => {
  const {
    branding,
    currentRole,
    students,
    feeReceipts,
    admissions,
    examPapers,
    expenses,
    setActiveModule,
    language
  } = useSchool();

  const isHindi = language === 'hi';

  const [aiTab, setAiTab] = useState<'CHAT' | 'CIRCULARS' | 'EARLY_WARNING' | 'LESSON_PLAN'>('CHAT');

  // Conversational AI State
  const [aiQuery, setAiQuery] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{ query: string; response: string; timestamp: string }[]>([
    {
      query: isHindi ? 'इस सत्र में कुल फीस संग्रह कितना हुआ है?' : 'What is the total fee collection for this academic session?',
      response: isHindi
        ? `${branding.name} में चालू शैक्षणिक सत्र में कुल ₹${feeReceipts.reduce((a, r) => a + r.paidAmount, 0).toLocaleString()} का फीस संग्रह दर्ज किया गया है। सभी डिजिटल रसीदें सत्यापित हैं।`
        : `At ${branding.name}, total fee collection for the current session stands at ₹${feeReceipts.reduce((a, r) => a + r.paidAmount, 0).toLocaleString()}. 100% digital receipts verified.`,
      timestamp: '10:15 AM'
    }
  ]);

  // Circular Generator State
  const [circularType, setCircularType] = useState<'HOLIDAY' | 'PTM' | 'FEE_REMINDER' | 'SPORTS_DAY' | 'EXAM_ADMIT'>('PTM');
  const [customEventDate, setCustomEventDate] = useState('2026-10-25');
  const [generatedCircular, setGeneratedCircular] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Lesson Plan Generator State
  const [lessonSubject, setLessonSubject] = useState('Science');
  const [lessonClass, setLessonClass] = useState('Class VIII');
  const [lessonTopic, setLessonTopic] = useState('Microorganisms: Friend and Foe');
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState<string>('');
  const [copiedLesson, setCopiedLesson] = useState(false);

  const totalStudents = students.length;
  const totalFeeCollected = feeReceipts.reduce((acc, r) => acc + r.paidAmount, 0);
  const pendingAdmissionsCount = admissions.filter((a) => a.status !== 'ENROLLED').length;
  const enrolledAdmissionsCount = admissions.filter((a) => a.status === 'ENROLLED').length;
  const avgAttendance = (students.reduce((acc, s) => acc + s.attendanceRate, 0) / (totalStudents || 1)).toFixed(1);

  // Chart Telemetry Datasets
  const weeklyAttendanceData = [
    { day: isHindi ? 'सोम' : 'Mon', attendance: 95.2, threshold: 85 },
    { day: isHindi ? 'मंगल' : 'Tue', attendance: 94.8, threshold: 85 },
    { day: isHindi ? 'बुध' : 'Wed', attendance: 96.1, threshold: 85 },
    { day: isHindi ? 'गुरु' : 'Thu', attendance: 93.9, threshold: 85 },
    { day: isHindi ? 'शुक्र' : 'Fri', attendance: 95.5, threshold: 85 },
    { day: isHindi ? 'शनि' : 'Sat', attendance: 92.4, threshold: 85 }
  ];

  const feeCategoryData = [
    { category: isHindi ? 'ट्यूशन फीस' : 'Tuition', collected: 1450000, target: 1600000 },
    { category: isHindi ? 'परिवहन (बस)' : 'Transport', collected: 210000, target: 250000 },
    { category: isHindi ? 'विज्ञान व लैब' : 'Lab/Comp', collected: 110000, target: 150000 },
    { category: isHindi ? 'खेल व सह-पाठ्य' : 'Activities', collected: 75000, target: 100000 }
  ];

  const sampleQueries = isHindi
    ? [
        'इस सत्र में कुल फीस संग्रह कितना हुआ है?',
        'किन कक्षाओं में औसत उपस्थिति 85% से कम है?',
        'कक्षा 8 विज्ञान में किन अध्यायों में कमजोर परिणाम हैं?',
        'प्रवेश प्रक्रिया में कितने आवेदन लंबित हैं?'
      ]
    : [
        'What is the total fee collection this session?',
        'Which classes have attendance below 85%?',
        'Which chapters in Class VIII Science have lowest pass rates?',
        'How many admission applications are pending?'
      ];

  const handleAskAI = (queryText: string) => {
    if (!queryText.trim()) return;

    let res = '';
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (queryText.includes('फीस') || queryText.includes('fee') || queryText.includes('collection')) {
      res = isHindi
        ? `चालू शैक्षणिक सत्र में कुल फीस संग्रह ₹${totalFeeCollected.toLocaleString()} है। सभी रसीदें ऑनलाइन पोर्टल व एसएमएस द्वारा अभिभावकों को भेजी जा चुकी हैं।`
        : `Total fee collected this session is ₹${totalFeeCollected.toLocaleString()}. All receipts are reconciled and dispatched to parents.`;
    } else if (queryText.includes('उपस्थिति') || queryText.includes('attendance')) {
      res = isHindi
        ? `स्कूल की औसत उपस्थिति ${avgAttendance}% है। कक्षा 10 वर्ग 'ब' की उपस्थिति 82.0% दर्ज की गई है, जो अनिवार्य 85% थ्रेसहोल्ड से कम है। संबंधित अभिभावकों को चेतावनी भेजी गई है।`
        : `Overall school attendance average is ${avgAttendance}%. Class X Section B is currently at 82.0%, which is below the mandatory 85% CBSE threshold. Automated alerts have been queued.`;
    } else if (queryText.includes('कमजोर') || queryText.includes('weak') || queryText.includes('Science') || queryText.includes('अध्याय')) {
      res = isHindi
        ? `एआई शैक्षणिक विश्लेषण के अनुसार कक्षा 8 विज्ञान के अध्याय 2 (सूक्ष्मजीव) में छात्रों का औसत स्कोर 64% रहा है। शिक्षक को उपचारात्मक कक्षाएं (Remedial Classes) आयोजित करने की सलाह दी जाती है।`
        : `AI Diagnostic Analytics reports that Class VIII Science Chapter 2 (Microorganisms) average is 64%. A targeted 2-week remedial session and formative revision quiz are recommended.`;
    } else if (queryText.includes('प्रवेश') || queryText.includes('admission')) {
      res = isHindi
        ? `वर्तमान में कुल ${pendingAdmissionsCount} नए प्रवेश आवेदन प्रधानाचार्य के दस्तावेज़ सत्यापन व शुल्क निर्माण हेतु प्रतीक्षारत हैं।`
        : `Currently, ${pendingAdmissionsCount} online admission applications are awaiting Principal document verification and fee generation.`;
    } else {
      res = isHindi
        ? `i2A स्कूल सहायक: ${branding.name} का संपूर्ण डेटा सुरक्षित व अद्यतन है। कुल ${totalStudents} सक्रिय विद्यार्थी नामांकित हैं और स्कूल परिचालन सुचारू है।`
        : `i2A School Copilot: All operational telemetry for ${branding.name} is synchronized. There are ${totalStudents} active enrolled students across all wings.`;
    }

    setAiChatHistory((prev) => [...prev, { query: queryText, response: res, timestamp: nowTime }]);
    setAiQuery('');
  };

  const handleGenerateCircular = () => {
    let text = '';
    if (circularType === 'PTM') {
      text = isHindi
        ? `आधिकारिक सूचना: अभिभावक-शिक्षक बैठक (PTM)\n\nदिनांक: ${customEventDate}\nस्कूल: ${branding.name}\n\nप्रिय अभिभावकगण,\nसादर सूचित किया जाता है कि आगामी सत्र मूल्यांकन पर चर्चा हेतु विद्यालय परिसर में अभिभावक-शिक्षक बैठक (PTM) आयोजित की जा रही है। आप अपने विद्यार्थी के साथ निर्धारित समय पर उपस्थित होकर प्रगति पत्रक व शैक्षणिक विकास की समीक्षा करें।\n\nसमय: प्रातः 09:00 बजे से दोपहर 01:00 बजे तक\nस्थान: मुख्य विद्यालय परिसर\n\nभवदीय,\nप्रधानाचार्य, ${branding.name}`
        : `OFFICIAL CIRCULAR: PARENT-TEACHER MEETING (PTM)\n\nDate: ${customEventDate}\nInstitution: ${branding.name}\n\nDear Parents / Guardians,\nThis is to cordially invite you to the upcoming Parent-Teacher Meeting (PTM) to discuss your ward's academic progression, term assessments, and holistic development.\n\nTiming: 09:00 AM to 01:00 PM\nVenue: Respective Homerooms, Main Campus\n\nWarm regards,\nPrincipal, ${branding.name}`;
    } else if (circularType === 'HOLIDAY') {
      text = isHindi
        ? `आधिकारिक परिपत्र: विद्यालय अवकाश सूचना\n\nदिनांक: ${customEventDate}\nस्कूल: ${branding.name}\n\nप्रिय अभिभावक एवं विद्यार्थी,\nसूचित किया जाता है कि आगामी त्यौहार/अवकाश के उपलक्ष्य में विद्यालय दिनांक ${customEventDate} से बंद रहेगा। विद्यालय का पुनः संचालन विधिवत समय-सारणी के अनुसार किया जाएगा।\n\nभवदीय,\nप्रधानाचार्य, ${branding.name}`
        : `OFFICIAL CIRCULAR: SCHOOL VACATION / HOLIDAY NOTICE\n\nDate: ${customEventDate}\nInstitution: ${branding.name}\n\nDear Parents & Students,\nPlease note that the school will remain closed on account of the scheduled break starting ${customEventDate}. Classes will resume as per regular timetable on the following working day.\n\nWarm regards,\nPrincipal, ${branding.name}`;
    } else if (circularType === 'FEE_REMINDER') {
      text = isHindi
        ? `आधिकारिक सूचना: तिमाही फीस जमा सूचना\n\nदिनांक: ${customEventDate}\nस्कूल: ${branding.name}\n\nप्रिय अभिभावक,\nसत्र की शैक्षणिक व परिवहन सेवाओं को सुचारू रखने हेतु कृपया अपने वार्ड की तिमाही फीस अंतिम तिथि ${customEventDate} तक ऑनलाइन पोर्टल अथवा काउंटर पर जमा करवाएं।\n\nधन्यवाद,\nलेखा विभाग, ${branding.name}`
        : `OFFICIAL NOTICE: QUARTERLY FEE CLEARANCE REMINDER\n\nDate: ${customEventDate}\nInstitution: ${branding.name}\n\nDear Parents,\nKindly clear the outstanding quarterly tuition and transport dues on or before ${customEventDate} via the online parent webapp or accounts desk to ensure uninterrupted services.\n\nThank you,\nAccounts Department, ${branding.name}`;
    } else {
      text = isHindi
        ? `आधिकारिक परिपत्र: वार्षिक खेल दिवस व प्रतियोगिता\n\nदिनांक: ${customEventDate}\nस्कूल: ${branding.name}\n\nप्रिय विद्यार्थी व अभिभावक,\nविद्यालय का वार्षिक खेल महोत्सव दिनांक ${customEventDate} को आयोजित होगा। सभी छात्र अपने खेल पोशाक में समय पर उपस्थित हों।\n\nप्रधानाचार्य, ${branding.name}`
        : `OFFICIAL CIRCULAR: ANNUAL SPORTS & ATHLETIC MEET\n\nDate: ${customEventDate}\nInstitution: ${branding.name}\n\nDear Students & Parents,\nThe Annual Athletic & Sports Meet is scheduled for ${customEventDate}. All participants are requested to report in designated house tracksuits.\n\nPrincipal, ${branding.name}`;
    }
    setGeneratedCircular(text);
  };

  const handleGenerateLessonPlan = () => {
    const text = isHindi
      ? `सीबीएसई एवं एनईपी 2020 अनुरूप पाठ योजना (5E मॉडल)\n\nविषय: ${lessonSubject} | कक्षा: ${lessonClass}\nप्रकरण: ${lessonTopic}\nसत्र अवधि: 45 मिनट\n\n1. संलग्न (Engage - 5 मिनट): वास्तविक जीवन के उदाहरणों और प्रश्नोत्तर से छात्रों की जिज्ञासा जगाना।\n2. अन्वेषण (Explore - 15 मिनट): प्रयोग एवं समूह गतिविधि द्वारा विषय की मूल अवधारणा को समझना।\n3. व्याख्या (Explain - 10 मिनट): शिक्षक द्वारा मुख्य वैज्ञानिक शब्दावली व सिद्धांतों की स्पष्ट प्रस्तुति।\n4. विस्तार (Elaborate - 10 मिनट): व्यावहारिक समस्याओं व दैनिक जीवन में अनुप्रयोग पर चर्चा।\n5. मूल्यांकन (Evaluate - 5 मिनट): 3 बहुविकल्पीय एवं 1 लघु उत्तरीय प्रश्न द्वारा समझ की जांच।\n\nगृहकार्य: विषय पर आधारित डिजिटल कार्यपत्रक पूर्ण करें।`
      : `CBSE & NEP 2020 ALIGNED 5E LESSON PLAN\n\nSubject: ${lessonSubject} | Grade: ${lessonClass}\nTopic: ${lessonTopic}\nDuration: 45 Minutes\n\n1. ENGAGE (5 min): Hook inquiry with real-world scenarios and diagnostic prior-knowledge queries.\n2. EXPLORE (15 min): Hands-on group activity and digital simulation exploring core concepts.\n3. EXPLAIN (10 min): Teacher facilitation of conceptual models, key vocabulary, and formal definitions.\n4. ELABORATE (10 min): Application of knowledge to novel problem-solving contexts.\n5. EVALUATE (5 min): Formative 3-item quiz and reflective exit-ticket check.\n\nHomework: Complete digital worksheet on i2A LMS portal.`;
    setGeneratedLessonPlan(text);
  };

  // --- 1. TEACHER WORKSPACE DASHBOARD ---
  if (currentRole === 'TEACHER') {
    return (
      <div className="space-y-6 animate-fade-in pb-12 text-xs">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
              {isHindi ? 'शिक्षक कार्यक्षेत्र पोर्टल' : 'Teacher Workspace Portal'}
            </span>
            <h2 className="text-2xl font-black mt-1">
              {isHindi ? 'स्वागत है, सम्मानित संकाय सदस्य' : 'Welcome, Senior Faculty Member'}
            </h2>
            <p className="text-amber-100 text-xs mt-0.5">
              {isHindi ? 'आवंटित कक्षाएं: कक्षा 8 वर्ग अ, कक्षा 9 वर्ग ब • विषय: गणित एवं विज्ञान' : 'Assigned Classes: Class VIII-A, Class IX-B • Subjects: Mathematics & Science'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModule('attendance_timetable')}
              className="px-4 py-2.5 rounded-2xl bg-white text-orange-700 font-extrabold shadow-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isHindi ? 'दैनिक उपस्थिति दर्ज करें' : 'Mark Daily Attendance'}
            </button>
          </div>
        </div>

        {/* Teacher Quick Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveModule('attendance_timetable')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-amber-500 transition-all shadow-sm cursor-pointer"
          >
            <CalendarCheck className="w-6 h-6 text-amber-500" />
            <div className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'उपस्थिति प्रविष्टि' : 'Attendance Entry'}
            </div>
            <div className="text-slate-400 text-[11px]">
              {isHindi ? 'कक्षा उपस्थिति रोल कॉल' : 'Daily Roster Marking'}
            </div>
          </button>
          <button
            onClick={() => setActiveModule('homework_learning')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-amber-500 transition-all shadow-sm cursor-pointer"
          >
            <BookOpen className="w-6 h-6 text-indigo-500" />
            <div className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'गृहकार्य जारी करें' : 'Post Homework'}
            </div>
            <div className="text-slate-400 text-[11px]">
              {isHindi ? 'डिजिटल वर्कशीट' : 'Digital Worksheets'}
            </div>
          </button>
          <button
            onClick={() => setActiveModule('examination_ai')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-amber-500 transition-all shadow-sm cursor-pointer"
          >
            <FileQuestion className="w-6 h-6 text-purple-500" />
            <div className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'एआई टेस्ट पेपर' : 'AI Test Paper'}
            </div>
            <div className="text-slate-400 text-[11px]">
              {isHindi ? 'प्रश्न पत्र निर्माण' : 'NCERT Question Bank'}
            </div>
          </button>
          <button
            onClick={() => setActiveModule('examination_result_engine')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-amber-500 transition-all shadow-sm cursor-pointer"
          >
            <Award className="w-6 h-6 text-emerald-500" />
            <div className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'अंक प्रविष्टि' : 'Enter Marks'}
            </div>
            <div className="text-slate-400 text-[11px]">
              {isHindi ? 'सत्र परीक्षा परिणाम' : 'Term Assessment Marks'}
            </div>
          </button>
        </div>
      </div>
    );
  }

  // --- 2. ACCOUNTANT WORKSPACE DASHBOARD ---
  if (currentRole === 'ACCOUNTANT') {
    return (
      <div className="space-y-6 animate-fade-in pb-12 text-xs">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase">
              {isHindi ? 'लेखाधिकारी कार्यक्षेत्र' : 'Accounts Finance Desk'}
            </span>
            <h2 className="text-2xl font-black mt-1">
              {isHindi ? 'फीस संग्रह एवं वित्तीय खाता-बही' : 'Fee Collection & Financial Ledger'}
            </h2>
            <p className="text-emerald-100 text-xs">
              {isHindi ? `चालू सत्र में कुल फीस संग्रह: ₹${totalFeeCollected.toLocaleString()}` : `Total Realized Fees: ₹${totalFeeCollected.toLocaleString()}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModule('fee_management')}
              className="px-4 py-2.5 rounded-2xl bg-white text-emerald-800 font-extrabold shadow-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isHindi ? 'नई फीस रसीद काटें' : 'Generate Fee Receipt'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div
            onClick={() => setActiveModule('fee_management')}
            className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-500 transition-all"
          >
            <CreditCard className="w-6 h-6 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'फीस रसीदें एवं बकाया' : 'Fee Invoices & Dues'}
            </h3>
            <p className="text-slate-400 text-[11px]">
              {isHindi ? 'प्रिंट करें और ऑनलाइन संग्रह की जांच करें' : 'Print receipts and verify payment gateways'}
            </p>
          </div>
          <div
            onClick={() => setActiveModule('payroll_expenses')}
            className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-500 transition-all"
          >
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'कर्मचारी वेतन एवं स्कूल खर्च' : 'Staff Payroll & Expenses'}
            </h3>
            <p className="text-slate-400 text-[11px]">
              {isHindi ? 'मासिक वेतन वितरण व खर्चों का वाउचर' : 'Monthly salary disbursement and expense ledger'}
            </p>
          </div>
          <div
            onClick={() => setActiveModule('audit_trail')}
            className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-emerald-500 transition-all"
          >
            <ShieldCheck className="w-6 h-6 text-purple-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'वित्तीय सुरक्षा व ऑडिट' : 'Financial Audit Logs'}
            </h3>
            <p className="text-slate-400 text-[11px]">
              {isHindi ? 'रसीद संशोधन व सुरक्षा लॉग रिकॉर्ड' : 'Tamper-evident audit trail'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. PARENT PORTAL WORKSPACE DASHBOARD ---
  if (currentRole === 'PARENT') {
    const child = students[0] || { name: 'Rahul Kumar', className: 'Class VIII', section: 'A', attendanceRate: 94.5 };
    return (
      <div className="space-y-6 animate-fade-in pb-12 text-xs">
        <div className="bg-gradient-to-r from-cyan-700 to-blue-600 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase">
              {isHindi ? 'अभिभावक पोर्टल' : 'Parent Guardian Portal'}
            </span>
            <h2 className="text-2xl font-black mt-1">
              {isHindi ? 'विद्यार्थी प्रगति एवं विद्यालय संपर्क' : 'Child Progress & School Connect'}
            </h2>
            <p className="text-cyan-100 text-xs">
              {isHindi ? 'विद्यार्थी:' : 'Linked Student:'} <span className="font-bold text-white">{child.name} ({child.className})</span>
            </p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 font-bold text-xs">
            {isHindi ? 'उपस्थिति:' : 'Attendance:'} <span className="text-emerald-300 font-extrabold">{child.attendanceRate}%</span>
          </div>
        </div>

        {/* Parent Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveModule('fee_management')}
            className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-cyan-500 transition-all"
          >
            <CreditCard className="w-6 h-6 text-cyan-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'फीस रसीद व भुगतान' : 'Fee Invoices & Dues'}
            </h3>
            <p className="text-slate-400 text-[11px]">
              {isHindi ? 'ऑनलाइन फीस भरें व आधिकारिक पीडीएफ रसीद लें' : 'Pay dues and download official receipt'}
            </p>
          </div>
          <div
            onClick={() => setActiveModule('examination_result_engine')}
            className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-cyan-500 transition-all"
          >
            <Award className="w-6 h-6 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'प्रगति पत्रक व अंक' : 'Report Cards & Marks'}
            </h3>
            <p className="text-slate-400 text-[11px]">
              {isHindi ? 'सत्र परीक्षा परिणाम व शिक्षक समीक्षा देखें' : 'View Term performance and gradebook'}
            </p>
          </div>
          <div
            onClick={() => setActiveModule('school_marketplace')}
            className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-cyan-500 transition-all"
          >
            <ShoppingBag className="w-6 h-6 text-purple-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'स्कूल स्टोर (ड्रेस व किताबें)' : 'School Store & Uniforms'}
            </h3>
            <p className="text-slate-400 text-[11px]">
              {isHindi ? 'यूनिफॉर्म, बैग एवं एनसीईआरटी बुक्स ऑर्डर करें' : 'Order authorized kits directly to class'}
            </p>
          </div>
          <div
            onClick={() => setActiveModule('library_transport')}
            className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-cyan-500 transition-all"
          >
            <Bus className="w-6 h-6 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              {isHindi ? 'लाइव बस ट्रैकर' : 'Live School Bus Tracker'}
            </h3>
            <p className="text-slate-400 text-[11px]">
              {isHindi ? 'वाहन चालक संपर्क व लाइव जीपीएस रूट' : 'Live GPS route and driver contact'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- 4. PRINCIPAL & SUPER ADMIN COMMAND CENTER (ONESCHOOLERP PRO DASHBOARD) ---
  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      {/* Title Header with Session & Edge Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="h-12 w-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              {branding.name?.charAt(0) || 'S'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                {isHindi ? 'प्रधानाचार्य व प्रशासनिक कमान' : 'Principal & Administrative Cockpit'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {isHindi ? `सत्र: ${branding.academicSession || '2026-2027'}` : `Session: ${branding.academicSession || '2026-2027'}`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              {branding.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              {isHindi
                ? 'OneSchoolERP मानक: सहज सिम्बॉलिक टाइल्स, लाइव वित्तीय स्थिति एवं एआई सहायक'
                : 'OneSchoolERP Standard: Minimalist operational tiles, real-time fiscal telemetry & automated CRM funnel.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{isHindi ? 'सिस्टम स्थिति: 100% सक्रिय' : 'System Health: 100% Live'}</span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards (OneSchoolERP Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Student Attendance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden group hover:border-indigo-500 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isHindi ? 'आज की छात्र उपस्थिति' : "Student Attendance Today"}</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{avgAttendance}%</span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">↑ 1.2%</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              {isHindi ? `${Math.round(totalStudents * 0.948)} उपस्थित / ${totalStudents} नामांकित` : `${Math.round(totalStudents * 0.948)} Present / ${totalStudents} Total Enrolled`}
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full" style={{ width: `${avgAttendance}%` }} />
          </div>
        </div>

        {/* KPI 2: Faculty Attendance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden group hover:border-indigo-500 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isHindi ? 'शिक्षक व स्टाफ उपस्थिति' : "Faculty & Staff Attendance"}</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">96.0%</span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">48 / 50</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              {isHindi ? '48 शिक्षक ड्यूटी पर • 2 स्वीकृत अवकाश पर' : '48 Faculty on Duty • 2 on Approved Leave'}
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: '96%' }} />
          </div>
        </div>

        {/* KPI 3: Fee Realization Velocity */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden group hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isHindi ? 'कुल फीस संग्रह' : 'Fee Realization'}</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">₹{totalFeeCollected.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">83.8%</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              {isHindi ? 'लक्ष्य: ₹22,00,000 • बकाया: ₹3,55,000' : 'Target: ₹22,00,000 • Outstanding: ₹3,55,000'}
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{ width: '83.8%' }} />
          </div>
        </div>

        {/* KPI 4: Admission CRM Pipeline */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden group hover:border-indigo-500 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isHindi ? 'प्रवेश व लीड्स (CRM)' : 'Admissions CRM Pipeline'}</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{admissions.length}</span>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{enrolledAdmissionsCount} {isHindi ? 'नामांकित' : 'Enrolled'}</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              {isHindi ? `${pendingAdmissionsCount} आवेदन प्रक्रियाधीन • व्हाट्सएप ऑटो-ड्रिप सक्रिय` : `${pendingAdmissionsCount} Pending Verification • WhatsApp Drip Active`}
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, (enrolledAdmissionsCount / (admissions.length || 1)) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ONE SCHOOL ERP STYLE 12-TILE OPERATIONAL APP GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {isHindi ? 'दैनिक परिचालन शॉर्टकट टाइल्स (OneSchoolERP ग्रिड)' : 'Daily Operational Launchpad (OneSchoolERP Tiles)'}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {isHindi ? '1-क्लिक त्वरित संचालन' : '1-Click Direct Access'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {/* Tile 1: Fee Counter */}
          <button
            onClick={() => setActiveModule('fee_management')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-emerald-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                POS
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-emerald-600 transition-colors">
                {isHindi ? 'फीस काउंटर' : 'Fee Counter'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'रसीद व ऑनलाइन वसूली' : 'Collect & Receipt Desk'}
              </div>
            </div>
          </button>

          {/* Tile 2: Daily Attendance */}
          <button
            onClick={() => setActiveModule('attendance_timetable')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-purple-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {avgAttendance}%
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-purple-600 transition-colors">
                {isHindi ? 'दैनिक उपस्थिति' : 'Daily Attendance'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'रोस्टर व डेली लॉक' : 'Roster & Tamper Lock'}
              </div>
            </div>
          </button>

          {/* Tile 3: Student SIS */}
          <button
            onClick={() => setActiveModule('student_management')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-blue-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {totalStudents}
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-blue-600 transition-colors">
                {isHindi ? 'विद्यार्थी विवरण' : 'Student SIS'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? '360° प्रोफाइल व आईडी' : '360° Profile & Roster'}
              </div>
            </div>
          </button>

          {/* Tile 4: Admissions & CRM */}
          <button
            onClick={() => setActiveModule('admissions_workflow')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-amber-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                CRM
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-amber-600 transition-colors">
                {isHindi ? 'एडमिशन व लीड्स' : 'Admissions CRM'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'व्हाट्सएप ऑटो-टारगेट' : 'Inquiries & WhatsApp'}
              </div>
            </div>
          </button>

          {/* Tile 5: Timetable */}
          <button
            onClick={() => setActiveModule('timetable_engine')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-indigo-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Routine
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 transition-colors">
                {isHindi ? 'समय सारिणी' : 'Timetable Engine'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'क्लास व शिक्षक रूटीन' : 'Period Slots & Conflicts'}
              </div>
            </div>
          </button>

          {/* Tile 6: Homework & LMS */}
          <button
            onClick={() => setActiveModule('homework_learning')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-rose-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                LMS
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-rose-600 transition-colors">
                {isHindi ? 'गृहकार्य व नोट्स' : 'Homework & LMS'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'डिजिटल असाइनमेंट' : 'Submissions & Review'}
              </div>
            </div>
          </button>

          {/* Tile 7: Exams & AI Papers */}
          <button
            onClick={() => setActiveModule('examination_ai')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-violet-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                <FileQuestion className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                AI
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-violet-600 transition-colors">
                {isHindi ? 'परीक्षा व प्रश्न पत्र' : 'Exams & Papers'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? '1-क्लिक पेपर जनरेटर' : 'Blueprints & Questions'}
              </div>
            </div>
          </button>

          {/* Tile 8: Report Cards */}
          <button
            onClick={() => setActiveModule('report_cards')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-yellow-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center shadow-md shadow-yellow-500/20">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                NEP 2020
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-amber-600 transition-colors">
                {isHindi ? 'प्रगति पत्रक (Marks)' : 'Report Cards'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'सीबीएसई ग्रेड व प्रिंट' : 'NEP & CBSE Marksheets'}
              </div>
            </div>
          </button>

          {/* Tile 9: Bus & Transport Fleet */}
          <button
            onClick={() => setActiveModule('library_transport')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-orange-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <Bus className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                GPS
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-orange-600 transition-colors">
                {isHindi ? 'स्कूल बस व फ्लीट' : 'Fleet & Transport'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'रूट व स्टॉप ट्रैकिंग' : 'Live Routes & Drivers'}
              </div>
            </div>
          </button>

          {/* Tile 10: Library Books */}
          <button
            onClick={() => setActiveModule('library_transport')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-teal-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Catalog
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-teal-600 transition-colors">
                {isHindi ? 'पुस्तकालय (Library)' : 'Digital Library'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'एनसीईआरटी बुक्स व इशू' : 'Books Issue & Fines'}
              </div>
            </div>
          </button>

          {/* Tile 11: Staff Workforce */}
          <button
            onClick={() => setActiveModule('staff_workforce')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-slate-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-700/20">
                <User className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                Staff
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-slate-700 transition-colors">
                {isHindi ? 'स्टाफ व छुट्टियां' : 'Staff Workforce'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'सैलरी व लीव अप्रूवल' : 'Leave Ledger & Pay'}
              </div>
            </div>
          </button>

          {/* Tile 12: School Website CMS */}
          <button
            onClick={() => setActiveModule('website_builder')}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left flex flex-col justify-between hover:border-indigo-500 hover:shadow-lg transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between w-full">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                Live
              </span>
            </div>
            <div className="mt-3">
              <div className="font-black text-slate-900 dark:text-white text-xs group-hover:text-pink-600 transition-colors">
                {isHindi ? 'स्कूल वेबसाइट व वीडियो' : 'Website & Media'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isHindi ? 'प्रमोशनल वीडियो व गैलरी' : 'Marketing & Subdomain'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* INTERACTIVE VISUAL RECHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Weekly Attendance Recharts Area Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                {isHindi ? 'साप्ताहिक उपस्थिति रुझान' : 'Attendance Analytics'}
              </span>
              <h3 className="font-black text-base text-slate-900 dark:text-white mt-0.5">
                {isHindi ? 'दैनिक उपस्थिति व 85% सीबीएससी मानक' : 'Weekly Attendance vs 85% Threshold'}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              {isHindi ? 'औसत: 94.8%' : 'Average: 94.8%'}
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis domain={[80, 100]} stroke="#94A3B8" fontSize={11} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="attendance" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#attendanceGradient)" name={isHindi ? 'उपस्थिति %' : 'Attendance %'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Collection by Category Recharts Bar Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {isHindi ? 'मदवार फीस संग्रह' : 'Fee Realization vs Target'}
              </span>
              <h3 className="font-black text-base text-slate-900 dark:text-white mt-0.5">
                {isHindi ? 'संग्रह बनाम मासिक लक्ष्य' : 'Collected vs Target (₹)'}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              ₹18.45 L
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeCategoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="category" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <RechartsTooltip
                  formatter={(val: any) => `₹${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="collected" fill="#10B981" radius={[8, 8, 0, 0]} name={isHindi ? 'वसूल हुआ' : 'Collected'} />
                <Bar dataKey="target" fill="#64748B" opacity={0.3} radius={[8, 8, 0, 0]} name={isHindi ? 'लक्ष्य' : 'Target'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ADMISSIONS CRM FUNNEL STRIP */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 rounded-3xl border border-indigo-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px] border border-indigo-400/30">
              {isHindi ? 'स्वायत्त प्रवेश व मार्केटिंग फनल' : 'Autonomous Admissions & Marketing Funnel'}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> WhatsApp Drip Active
            </span>
          </div>
          <h3 className="text-lg font-black text-white">
            {isHindi ? 'स्कूल वेबसाइट सबडोमेन से एडमिशन लीड्स' : 'Admissions Pipeline & WhatsApp Auto-Targeting'}
          </h3>
          <p className="text-xs text-indigo-200/80 max-w-xl">
            {isHindi
              ? 'वेबसाइट सबडोमेन से आई पूछताछ पर स्कूल के मुख्य नंबर से स्वतः व्हाट्सएप संदेश, डिजिटल प्रॉस्पेक्टस व ऐप डाउनलोड लिंक भेजा जा रहा है।'
              : 'Public inquiry submissions automatically trigger WhatsApp welcome packs with school prospectus and webapp download link.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-indigo-800/60 text-xs">
            <div className="text-center">
              <div className="text-base font-black text-white">{admissions.length}</div>
              <div className="text-[10px] text-indigo-300">{isHindi ? 'कुल पूछताछ' : 'Inquiries'}</div>
            </div>
            <div className="h-6 w-px bg-indigo-800/60" />
            <div className="text-center">
              <div className="text-base font-black text-amber-400">{pendingAdmissionsCount}</div>
              <div className="text-[10px] text-amber-300">{isHindi ? 'काउंसलिंग' : 'In Nurture'}</div>
            </div>
            <div className="h-6 w-px bg-indigo-800/60" />
            <div className="text-center">
              <div className="text-base font-black text-emerald-400">{enrolledAdmissionsCount}</div>
              <div className="text-[10px] text-emerald-300">{isHindi ? 'नामांकित' : 'Enrolled'}</div>
            </div>
          </div>

          <button
            onClick={() => setActiveModule('admissions_workflow')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>{isHindi ? 'लीड्स व कानबान खोलें' : 'Open CRM Pipeline'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pro-Level Multi-Function AI Command Center */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl border border-indigo-800/80 shadow-2xl p-6 space-y-6">
        {/* AI Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  {isHindi ? 'i2A प्रो-लेवल स्कूल एआई कोपायलट' : 'i2A Pro-Grade School AI Copilot'}
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-extrabold border border-purple-500/30">
                  {isHindi ? 'सीबीएसई व एनईपी 2020 अनुरूप' : 'CBSE & NEP 2020 Aligned'}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                {isHindi ? 'प्राकृतिक भाषा में स्कूल डेटा विश्लेषण, आधिकारिक नोटिस जनरेटर एवं छात्र जोखिम मूल्यांकन' : 'Natural language school telemetry, official notice drafting, and diagnostic early-warning'}
              </p>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-indigo-900/60 flex-wrap">
            <button
              onClick={() => setAiTab('CHAT')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs cursor-pointer ${
                aiTab === 'CHAT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> {isHindi ? 'एआई बातचीत' : 'School Insights'}
            </button>
            <button
              onClick={() => { setAiTab('CIRCULARS'); if (!generatedCircular) handleGenerateCircular(); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs cursor-pointer ${
                aiTab === 'CIRCULARS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> {isHindi ? 'नोटिस जनरेटर' : 'Notice Drafter'}
            </button>
            <button
              onClick={() => setAiTab('EARLY_WARNING')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs cursor-pointer ${
                aiTab === 'EARLY_WARNING' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" /> {isHindi ? 'जोखिम चेतावनी' : 'Early Warning'}
            </button>
            <button
              onClick={() => { setAiTab('LESSON_PLAN'); if (!generatedLessonPlan) handleGenerateLessonPlan(); }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs cursor-pointer ${
                aiTab === 'LESSON_PLAN' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-400" /> {isHindi ? 'पाठ योजना (5E)' : '5E Lesson Plan'}
            </button>
          </div>
        </div>

        {/* Tab 1: AI Chat Assistant */}
        {aiTab === 'CHAT' && (
          <div className="space-y-4 animate-fade-in">
            {/* Chat History */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {aiChatHistory.map((msg, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-lg shadow-sm">
                      <p className="font-semibold">{msg.query}</p>
                      <span className="text-[10px] text-indigo-200 block text-right mt-1">{msg.timestamp}</span>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-slate-800/80 border border-slate-700/80 text-slate-100 px-4 py-3 rounded-2xl rounded-tl-none max-w-xl space-y-1 shadow-sm">
                      <div className="flex items-center gap-1.5 text-purple-400 font-bold text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" /> i2A Autonomous AI
                      </div>
                      <p className="leading-relaxed">{msg.response}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-400 font-semibold shrink-0">{isHindi ? 'सुझावित प्रश्न:' : 'Suggested Prompts:'}</span>
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskAI(q)}
                  className="px-3 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 whitespace-nowrap transition-colors border border-slate-700 shrink-0 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAI(aiQuery);
              }}
              className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-2xl p-2 shadow-inner"
            >
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder={isHindi ? 'स्कूल डेटा, फीस, उपस्थिति या परीक्षा संबंधी प्रश्न पूछें...' : 'Ask about fee collections, attendance outliers, student risks...'}
                className="flex-1 bg-transparent px-3 py-1.5 text-white placeholder-slate-400 text-xs outline-none"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:opacity-90 transition-opacity shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Circular Drafter */}
        {aiTab === 'CIRCULARS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            <div className="lg:col-span-5 space-y-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                {isHindi ? 'आधिकारिक परिपत्र विन्यास' : 'Notice Parameters'}
              </h4>

              <div>
                <label className="text-slate-400 block font-medium mb-1">{isHindi ? 'परिपत्र प्रकार' : 'Circular Type'}</label>
                <select
                  value={circularType}
                  onChange={(e) => setCircularType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none font-bold text-xs"
                >
                  <option value="PTM">{isHindi ? 'अभिभावक-शिक्षक बैठक (PTM)' : 'Parent-Teacher Meeting (PTM)'}</option>
                  <option value="HOLIDAY">{isHindi ? 'त्यौहार / अवकाश सूचना' : 'Vacation / Holiday Notice'}</option>
                  <option value="FEE_REMINDER">{isHindi ? 'तिमाही फीस बकाया अनुस्मारक' : 'Quarterly Fee Reminder'}</option>
                  <option value="SPORTS_DAY">{isHindi ? 'वार्षिक खेल दिवस सूचना' : 'Sports Day Circular'}</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block font-medium mb-1">{isHindi ? 'घटना / अंतिम तिथि' : 'Event / Deadline Date'}</label>
                <input
                  type="date"
                  value={customEventDate}
                  onChange={(e) => setCustomEventDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateCircular}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isHindi ? 'आधिकारिक नोटिस जनरेट करें' : 'Generate Formal Notice'}
              </button>
            </div>

            <div className="lg:col-span-7 space-y-3 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-mono text-xs font-bold text-indigo-400">
                  {branding.name} • {isHindi ? 'आधिकारिक ड्राफ्ट' : 'Official Letterhead Draft'}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCircular);
                    setCopiedNotice(true);
                    setTimeout(() => setCopiedNotice(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedNotice ? (isHindi ? 'कॉपी हो गया' : 'Copied') : (isHindi ? 'कॉपी करें' : 'Copy Notice')}
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-200 max-h-64 overflow-y-auto">
                {generatedCircular || (isHindi ? 'परिपत्र तैयार करने हेतु बायीं ओर बटन दबाएं।' : 'Click Generate to draft notice.')}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Early Warning Risk Alerts */}
        {aiTab === 'EARLY_WARNING' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Risk 1 */}
              <div className="bg-rose-950/30 border border-rose-800/50 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-rose-400 font-extrabold text-xs">
                  <span>{isHindi ? 'उपस्थिति थ्रेसहोल्ड अलर्ट' : 'Attendance Outlier'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-900 text-rose-200 text-[10px]">High</span>
                </div>
                <div className="text-white font-bold text-sm">Class X - Section B</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {isHindi
                    ? 'कक्षा 10 वर्ग ब की औसत उपस्थिति 82.0% है, जो सीबीएसई 85% न्यूनतम उपस्थिति नियम के अनुसार जोखिम में है।'
                    : 'Class average stands at 82.0%. 6 students require mandatory attendance intervention before term exams.'}
                </p>
                <button
                  onClick={() => setActiveModule('attendance_timetable')}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                >
                  {isHindi ? 'उपस्थिति विवरण देखें' : 'Review Class Attendance'}
                </button>
              </div>

              {/* Risk 2 */}
              <div className="bg-amber-950/30 border border-amber-800/50 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-amber-400 font-extrabold text-xs">
                  <span>{isHindi ? 'शैक्षणिक प्रदर्शन अंतराल' : 'Academic Dip Alert'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-900 text-amber-200 text-[10px]">Medium</span>
                </div>
                <div className="text-white font-bold text-sm">Class VIII - Science</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {isHindi
                    ? 'साप्ताहिक मूल्यांकन में सूक्ष्मजीव अध्याय में 38% छात्रों ने 50% से कम अंक प्राप्त किए।'
                    : 'Microorganisms chapter weekly test showed a 38% fail rate on high-order reasoning questions.'}
                </p>
                <button
                  onClick={() => setActiveModule('homework_learning')}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
                >
                  {isHindi ? 'उपचारात्मक वर्कशीट जारी करें' : 'Assign Remedial Worksheet'}
                </button>
              </div>

              {/* Risk 3 */}
              <div className="bg-indigo-950/30 border border-indigo-800/50 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-indigo-400 font-extrabold text-xs">
                  <span>{isHindi ? 'लंबित फीस बकाया' : 'Overdue Fee Delay'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-200 text-[10px]">Low</span>
                </div>
                <div className="text-white font-bold text-sm">₹45,000 Unreconciled</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {isHindi
                    ? '18 अभिभावकों की दूसरी तिमाही फीस 30 दिनों से अधिक समय से बकाया है।'
                    : '18 student accounts pending Quarter II tuition dues beyond the grace threshold.'}
                </p>
                <button
                  onClick={() => setActiveModule('fee_management')}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer"
                >
                  {isHindi ? 'फीस संग्रह पोर्टल खोलें' : 'Open Fee Collection Desk'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: 5E Lesson Planner */}
        {aiTab === 'LESSON_PLAN' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            <div className="lg:col-span-5 space-y-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-emerald-400" />
                {isHindi ? 'एनईपी 2020 5E पाठ योजना निर्माता' : 'NEP 2020 5E Lesson Planner'}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block font-medium mb-1">{isHindi ? 'कक्षा' : 'Grade'}</label>
                  <select
                    value={lessonClass}
                    onChange={(e) => setLessonClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none font-bold text-xs"
                  >
                    <option value="Class VI">Class VI</option>
                    <option value="Class VII">Class VII</option>
                    <option value="Class VIII">Class VIII</option>
                    <option value="Class IX">Class IX</option>
                    <option value="Class X">Class X</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block font-medium mb-1">{isHindi ? 'विषय' : 'Subject'}</label>
                  <select
                    value={lessonSubject}
                    onChange={(e) => setLessonSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none font-bold text-xs"
                  >
                    <option value="Science">Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Social Science">Social Science</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block font-medium mb-1">{isHindi ? 'अध्याय / प्रकरण' : 'Topic'}</label>
                <input
                  type="text"
                  value={lessonTopic}
                  onChange={(e) => setLessonTopic(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateLessonPlan}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isHindi ? '5E पाठ योजना तैयार करें' : 'Generate 5E Lesson Plan'}
              </button>
            </div>

            <div className="lg:col-span-7 space-y-3 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {isHindi ? 'सीबीएसई शैक्षणिक ढांचा 2026' : 'CBSE Pedagogy Standard 2026'}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLessonPlan);
                    setCopiedLesson(true);
                    setTimeout(() => setCopiedLesson(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  {copiedLesson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLesson ? (isHindi ? 'कॉपी हो गया' : 'Copied') : (isHindi ? 'पाठ योजना कॉपी करें' : 'Copy Lesson Plan')}
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-200 max-h-64 overflow-y-auto">
                {generatedLessonPlan || (isHindi ? 'पाठ योजना तैयार करने हेतु बायीं ओर बटन दबाएं।' : 'Click Generate to draft 5E Lesson Plan.')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
