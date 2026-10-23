import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  Globe,
  ExternalLink,
  UserPlus,
  Phone,
  Mail,
  CheckCircle2,
  MapPin,
  Award,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  School,
  Check,
  Send,
  Play,
  Video,
  Image as ImageIcon,
  Download,
  MessageSquare,
  Plus,
  Trash2,
  X,
  Eye
} from 'lucide-react';
import { UserRole } from '../../types';

export const WebsiteBuilderModule: React.FC = () => {
  const {
    branding,
    updateBranding,
    feeTypes,
    submitSchoolAdmission,
    setCurrentRole,
    setActiveModule,
    language
  } = useSchool();

  // Active view inside the website preview
  const [siteTab, setSiteTab] = useState<'HOME' | 'VIDEO' | 'GALLERY' | 'ADMISSION' | 'FEES' | 'NOTICES' | 'PORTAL_LOGIN'>('HOME');
  
  // CMS Configuration Active Panel
  const [activeConfigPanel, setActiveConfigPanel] = useState<'DOMAIN' | 'PROMOTIONAL_MEDIA' | 'GALLERY_MANAGER' | 'WHATSAPP_FUNNEL'>('DOMAIN');

  // Domain Configuration State
  const [domainMode, setDomainMode] = useState<'SUBDOMAIN' | 'CUSTOM_DOMAIN'>(
    branding.domainType || 'SUBDOMAIN'
  );
  const [customDomainInput, setCustomDomainInput] = useState(
    branding.customDomain || 'www.abcpublicschool.edu.in'
  );
  const [subdomainInput, setSubdomainInput] = useState(
    branding.subdomainSlug || 'abcpublicschool'
  );
  const [isSaved, setIsSaved] = useState(false);

  // Marketing & Promotional Media State
  const [promoVideoUrl, setPromoVideoUrl] = useState(
    branding.promotionalVideoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  );
  const [promoVideoTitle, setPromoVideoTitle] = useState(
    branding.promotionalVideoTitle || 'Welcome to ABC Public School - Campus Tour & Excellence'
  );
  const [promoVideoPoster, setPromoVideoPoster] = useState(
    branding.promotionalVideoPoster || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80'
  );
  const [brochureUrl, setBrochureUrl] = useState(
    branding.brochurePdfUrl || 'https://abcpublicschool.i2aschool.com/brochure-2026-27.pdf'
  );
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    branding.whatsappAutoReplyTemplate ||
      'नमस्ते {parentName} जी, {schoolName} में {studentName} के प्रवेश (कक्षा {className}) संबंधी जानकारी प्राप्त करने के लिए धन्यवाद! 📖 डिजिटल प्रॉस्पेक्टस: {brochureUrl} 📲 आधिकारिक स्कूल वेब-ऐप डाउनलोड करें: {pwaUrl} — प्रवेश विभाग'
  );

  // New Gallery Item State
  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState<'Campus' | 'Classrooms' | 'Labs' | 'Sports' | 'Library'>('Campus');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Gallery Filter State inside preview
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('ALL');

  // Admission Inquiry Form State
  const [admForm, setAdmForm] = useState({
    studentName: '',
    applyingClass: 'Class VI',
    parentName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    address: '',
    city: '',
    previousSchool: 'St. Paul High School',
    remarks: 'Interested in School Bus facility and Science Lab coaching'
  });
  const [submittedApplicationNo, setSubmittedApplicationNo] = useState<string | null>(null);
  const [lastSubmittedLead, setLastSubmittedLead] = useState<{
    studentName: string;
    parentName: string;
    phone: string;
    className: string;
    applicationNo: string;
  } | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const activeWebsiteUrl =
    domainMode === 'CUSTOM_DOMAIN'
      ? customDomainInput
      : `${subdomainInput}.i2aschool.com`;

  // Helper to convert YouTube URL to embed URL
  const getEmbedVideoUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
    }
    return url;
  };

  const handleSaveAllBranding = () => {
    updateBranding({
      domainType: domainMode,
      customDomain: customDomainInput,
      subdomainSlug: subdomainInput,
      website: activeWebsiteUrl,
      promotionalVideoUrl: promoVideoUrl,
      promotionalVideoTitle: promoVideoTitle,
      promotionalVideoPoster: promoVideoPoster,
      brochurePdfUrl: brochureUrl,
      whatsappAutoReplyTemplate: whatsappTemplate
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddGalleryImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryTitle || !newGalleryUrl) return;
    const currentList = branding.galleryImages || [];
    const updated = [
      ...currentList,
      {
        id: `img-${Date.now()}`,
        title: newGalleryTitle,
        category: newGalleryCategory,
        url: newGalleryUrl
      }
    ];
    updateBranding({ galleryImages: updated });
    setNewGalleryTitle('');
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryImage = (identifier: string) => {
    const currentList = branding.galleryImages || [];
    updateBranding({
      galleryImages: currentList.filter((item, idx) => (item.id || item.url || idx.toString()) !== identifier)
    });
  };

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admForm.studentName || !admForm.parentName || !admForm.phone) {
      alert('कृपया छात्र का नाम, अभिभावक का नाम और संपर्क नंबर अवश्य भरें (Please fill required fields)');
      return;
    }

    const createdApp = submitSchoolAdmission({
      studentName: admForm.studentName,
      applyingClass: admForm.applyingClass,
      parentName: admForm.parentName,
      phone: admForm.phone,
      whatsappNumber: admForm.whatsappNumber || admForm.phone,
      email: admForm.email || `${admForm.studentName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      address: admForm.address || 'Patna City, Bihar',
      city: admForm.city || 'Patna',
      remarks: `Previous School: ${admForm.previousSchool}. ${admForm.remarks}`
    });

    setSubmittedApplicationNo(createdApp.applicationNo);
    setLastSubmittedLead({
      studentName: admForm.studentName,
      parentName: admForm.parentName,
      phone: admForm.whatsappNumber || admForm.phone,
      className: admForm.applyingClass,
      applicationNo: createdApp.applicationNo
    });
    setShowWhatsAppModal(true);

    // Reset fields
    setAdmForm({
      studentName: '',
      applyingClass: 'Class VI',
      parentName: '',
      phone: '',
      whatsappNumber: '',
      email: '',
      address: '',
      city: '',
      previousSchool: '',
      remarks: ''
    });
  };

  const handlePortalQuickLogin = (role: UserRole, targetModule: string) => {
    setCurrentRole(role);
    setActiveModule(targetModule);
  };

  const galleryItems = branding.galleryImages || [
    {
      id: 'g-1',
      title: 'Smart Digital Classrooms with Interactive Flat Panels',
      category: 'Classrooms',
      url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'g-2',
      title: 'Advanced AI & Robotics STEM Learning Lab',
      category: 'Labs',
      url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'g-3',
      title: 'Olympic-Standard Sports Complex & Football Arena',
      category: 'Sports',
      url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'g-4',
      title: 'High-Tech Digital Library & Quiet Research Pods',
      category: 'Library',
      url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop&q=80'
    }
  ];

  const filteredGallery =
    selectedGalleryCategory === 'ALL'
      ? galleryItems
      : galleryItems.filter((item) => item.category === selectedGalleryCategory);

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Globe className="w-4 h-4" /> School Marketing Engine & Website CMS
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            School Microsite, Promotional Video & Admission Funnel
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            हर स्कूल की अपनी ब्रांडेड वेबसाइट — सब-डोमेन, प्रोमो वीडियो, कैंपस फोटो गैलरी और ऑटो-व्हाट्सएप लीड जनरेशन।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://${activeWebsiteUrl}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              e.preventDefault();
              alert(`Visiting Live Subdomain: https://${activeWebsiteUrl}\n(Live Edge Preview below displays real production layout)`);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Visit Live Subdomain
          </a>
        </div>
      </div>

      {/* CMS Management Navigation Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="font-extrabold text-sm">स्कूल वेबसाइट एवं मार्केटिंग कंट्रोल सेंटर (CMS & Media Hub)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAllBranding}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 text-xs shadow-md transition-all"
            >
              {isSaved ? <Check className="w-4 h-4" /> : null}
              {isSaved ? 'Settings Saved & Live!' : 'Save & Deploy Changes'}
            </button>
          </div>
        </div>

        {/* Panel Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs">
          <button
            onClick={() => setActiveConfigPanel('DOMAIN')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              activeConfigPanel === 'DOMAIN' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> 1. डोमेन सेटिंग्स (Domain Mapping)
          </button>
          <button
            onClick={() => setActiveConfigPanel('PROMOTIONAL_MEDIA')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              activeConfigPanel === 'PROMOTIONAL_MEDIA' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> 2. प्रोमो वीडियो एवं ब्रोशर (Promotional Media)
          </button>
          <button
            onClick={() => setActiveConfigPanel('GALLERY_MANAGER')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              activeConfigPanel === 'GALLERY_MANAGER' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> 3. कैंपस फोटो गैलरी (Photo Gallery)
          </button>
          <button
            onClick={() => setActiveConfigPanel('WHATSAPP_FUNNEL')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              activeConfigPanel === 'WHATSAPP_FUNNEL' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> 4. ऑटो व्हाट्सएप फनल (WhatsApp Nurture)
          </button>
        </div>

        {/* Panel 1: Domain Mapping */}
        {activeConfigPanel === 'DOMAIN' && (
          <div className="space-y-4 pt-1 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Domain Routing Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDomainMode('SUBDOMAIN')}
                    className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                      domainMode === 'SUBDOMAIN' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    i2A Subdomain
                  </button>
                  <button
                    type="button"
                    onClick={() => setDomainMode('CUSTOM_DOMAIN')}
                    className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                      domainMode === 'CUSTOM_DOMAIN' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Custom Domain
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                  {domainMode === 'SUBDOMAIN' ? 'Subdomain Slug' : 'School Official Custom Domain (FQDN)'}
                </label>
                {domainMode === 'SUBDOMAIN' ? (
                  <div className="flex items-center w-full bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                    <input
                      type="text"
                      value={subdomainInput}
                      onChange={(e) => setSubdomainInput(e.target.value)}
                      className="flex-1 bg-transparent px-3 py-2 text-white font-mono font-semibold focus:outline-none"
                    />
                    <span className="px-3 text-slate-400 font-mono text-[11px] bg-slate-900 border-l border-slate-700 py-2">
                      .i2aschool.com
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center w-full bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                    <span className="px-3 text-slate-500 font-mono text-[11px] bg-slate-900 border-r border-slate-700 py-2">
                      https://
                    </span>
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      placeholder="e.g. www.dpspatna.edu.in"
                      className="flex-1 bg-transparent px-3 py-2 text-white font-mono font-semibold focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-300 flex flex-wrap justify-between items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live SSL Certificate: <b>Active (TLS 1.3 / Let's Encrypt 4096-bit)</b>
              </span>
              <span className="text-slate-400">DNS Endpoint: <b className="font-mono text-indigo-400">cname.edge.i2aschoolos.com</b></span>
            </div>
          </div>
        )}

        {/* Panel 2: Promotional Video & Brochure */}
        {activeConfigPanel === 'PROMOTIONAL_MEDIA' && (
          <div className="space-y-4 pt-1 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                  स्कूल का प्रमोशनल वीडियो URL (YouTube, Vimeo या Direct MP4) *
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                  <Video className="w-4 h-4 ml-3 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={promoVideoUrl}
                    onChange={(e) => setPromoVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-transparent px-3 py-2 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 YouTube वीडियो लिंक डालने पर प्लेयर ऑटो-एम्बेड हो जाता है।
                </p>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                  प्रमोशनल वीडियो का शीर्षक (Video Heading / Title)
                </label>
                <input
                  type="text"
                  value={promoVideoTitle}
                  onChange={(e) => setPromoVideoTitle(e.target.value)}
                  placeholder="e.g. Welcome to ABC Public School - Campus Tour & Excellence"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                  वीडियो पोस्टर / थंबनेल इमेज URL (Cover Poster)
                </label>
                <input
                  type="text"
                  value={promoVideoPoster}
                  onChange={(e) => setPromoVideoPoster(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                  डिजिटल प्रॉस्पेक्टस / ब्रोशर PDF URL (Prospectus Link)
                </label>
                <input
                  type="text"
                  value={brochureUrl}
                  onChange={(e) => setBrochureUrl(e.target.value)}
                  placeholder="https://myschool.com/brochure.pdf"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Panel 3: Campus Gallery Manager */}
        {activeConfigPanel === 'GALLERY_MANAGER' && (
          <div className="space-y-4 pt-1 animate-fade-in">
            {/* Add new photo form */}
            <form onSubmit={handleAddGalleryImage} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> नई कैंपस फोटो जोड़ें (Add New Campus Photo)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[10px]">Photo Caption / Title</label>
                  <input
                    type="text"
                    required
                    value={newGalleryTitle}
                    onChange={(e) => setNewGalleryTitle(e.target.value)}
                    placeholder="e.g. Modern Chemistry Lab"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[10px]">Category</label>
                  <select
                    value={newGalleryCategory}
                    onChange={(e) => setNewGalleryCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none"
                  >
                    <option value="Campus">Campus & Infrastructure</option>
                    <option value="Classrooms">Classrooms & Smart Boards</option>
                    <option value="Labs">Science & Robotics Labs</option>
                    <option value="Sports">Sports Ground & Arena</option>
                    <option value="Library">Library & Study Halls</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[10px]">Image URL</label>
                  <input
                    type="url"
                    required
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> गैलरी में सेव करें (Add to Gallery)
              </button>
            </form>

            {/* List of current photos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {galleryItems.map((img, idx) => (
                <div key={img.id || ("img-" + idx)} className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative group">
                  <img src={img.url} alt={img.title} className="w-full h-24 object-cover" />
                  <div className="p-2 space-y-0.5">
                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-950 text-indigo-300 rounded font-bold">{img.category}</span>
                    <p className="text-[11px] font-semibold text-white truncate">{img.title}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveGalleryImage(img.id || img.url || idx.toString())}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panel 4: WhatsApp Funnel Config */}
        {activeConfigPanel === 'WHATSAPP_FUNNEL' && (
          <div className="space-y-4 pt-1 animate-fade-in">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">
                ऑटो-टार्गेटिंग व्हाट्सएप संदेश टेम्पलेट (Automated WhatsApp Nurture Template)
              </label>
              <textarea
                rows={4}
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-mono focus:outline-none"
              />
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-2">
                <span>सपोर्टेड टैग्स:</span>
                <span className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">{'{parentName}'}</span>
                <span className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">{'{studentName}'}</span>
                <span className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">{'{className}'}</span>
                <span className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">{'{schoolName}'}</span>
                <span className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">{'{brochureUrl}'}</span>
                <span className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">{'{pwaUrl}'}</span>
              </div>
            </div>

            <div className="bg-emerald-950/60 p-4 rounded-2xl border border-emerald-800/80 text-emerald-300 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-white">24x7 ऑटोमेटेड लीड नर्चरिंग एक्टिव (Automated Lead Pipeline)</p>
                <p className="text-[11px] text-emerald-200">
                  जैसे ही कोई अभिभावक सब-डोमेन पर इंक्वायरी फॉर्म भरता है, स्कूल के ऑफिशियल नंबर से यह मैसेज सीधे उनके व्हाट्सएप पर चला जाता है। इसमें डिजिटल ब्रोशर और स्कूल ऐप इंस्टॉल करने का डायरेक्ट लिंक शामिल होता है।
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Interactive School Website Preview Window */}
      <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden max-w-5xl mx-auto">
        {/* Browser Mock Chrome */}
        <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800 text-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-2 ml-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-indigo-400 text-[11px]">https://{activeWebsiteUrl}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold border border-indigo-800">
              Live School Edge Node Preview
            </span>
          </div>
        </div>

        {/* Live School Website Body */}
        <div className="bg-slate-950 p-6 sm:p-8 space-y-8 text-slate-100 font-sans">
          {/* School Website Navigation Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-3">
              <img
                src={branding.logoUrl}
                alt="School Logo"
                className="h-12 w-12 object-cover rounded-xl border border-slate-800 shadow-md"
              />
              <div>
                <h3 className="font-black text-lg tracking-tight text-white">{branding.name}</h3>
                <p className="text-[11px] text-slate-400">{branding.tagline}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5 font-medium">
                  <span>Affiliated to {branding.board}</span>
                  <span>•</span>
                  <span>Reg: {branding.regNumber}</span>
                  <span>•</span>
                  <span>Session: {branding.academicSession}</span>
                </div>
              </div>
            </div>

            {/* School Website Nav Links */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSiteTab('HOME')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  siteTab === 'HOME' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setSiteTab('VIDEO')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  siteTab === 'VIDEO' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-400" /> Campus Film
              </button>
              <button
                type="button"
                onClick={() => setSiteTab('GALLERY')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  siteTab === 'GALLERY' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Photo Gallery
              </button>
              <button
                type="button"
                onClick={() => setSiteTab('ADMISSION')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  siteTab === 'ADMISSION'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Apply Online
              </button>
              <button
                type="button"
                onClick={() => setSiteTab('FEES')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  siteTab === 'FEES' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fees
              </button>
              <button
                type="button"
                onClick={() => setSiteTab('NOTICES')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  siteTab === 'NOTICES' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Notices
              </button>
              <button
                type="button"
                onClick={() => setSiteTab('PORTAL_LOGIN')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  siteTab === 'PORTAL_LOGIN' ? 'bg-purple-600 text-white font-bold' : 'text-purple-300 hover:text-white'
                }`}
              >
                Portal Login
              </button>
            </div>
          </div>

          {/* TAB 1: HOME */}
          {siteTab === 'HOME' && (
            <div className="space-y-6">
              {/* Hero Banner */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-8 sm:p-10 rounded-3xl border border-indigo-900/40 text-center space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <span className="px-3.5 py-1 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">
                  ⚡ Admissions Open for Academic Session {branding.academicSession}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white max-w-2xl mx-auto leading-tight">
                  Nurturing Excellence, Character & Future Leadership
                </h2>
                <p className="text-xs sm:text-sm text-indigo-200 max-w-xl mx-auto leading-relaxed">
                  World-Class Digital Smart Classrooms • AI-Powered Personalized Learning • State-of-the-Art Science & Robotics Labs • GPS Tracked Safe Fleet.
                </p>

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setSiteTab('ADMISSION')}
                    className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Start Online Admission
                  </button>
                  <button
                    onClick={() => setSiteTab('VIDEO')}
                    className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Watch Campus Video
                  </button>
                  <a
                    href={brochureUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Downloading Official School Prospectus (Session ${branding.academicSession})`);
                    }}
                    className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" /> Digital Prospectus
                  </a>
                </div>
              </div>

              {/* Promotional Video Banner Section */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                      <Video className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{promoVideoTitle}</h4>
                      <p className="text-[10px] text-slate-400">Explore our campus, digital labs, sports arena and faculty in action</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSiteTab('VIDEO')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    Full Cinema View <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Video Player */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group shadow-inner">
                  {promoVideoUrl.includes('youtube.com') || promoVideoUrl.includes('youtu.be') ? (
                    <iframe
                      src={getEmbedVideoUrl(promoVideoUrl)}
                      title={promoVideoTitle}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full relative flex items-center justify-center">
                      <img
                        src={promoVideoPoster}
                        alt="Campus Video Poster"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer">
                          <Play className="w-7 h-7 fill-white translate-x-0.5" />
                        </div>
                        <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full border border-white/20">
                          Click to Play Virtual School Tour
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Highlights 4-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1 hover:border-indigo-500/50 transition-all">
                  <BookOpen className="w-5 h-5 text-indigo-400 mx-auto" />
                  <h4 className="font-extrabold text-white text-xs mt-1">Smart Learning</h4>
                  <p className="text-[10px] text-slate-400">Interactive Projectors & AI Practice</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1 hover:border-emerald-500/50 transition-all">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto" />
                  <h4 className="font-extrabold text-white text-xs mt-1">100% Safe Campus</h4>
                  <p className="text-[10px] text-slate-400">CCTV Surveillance & RFID Gates</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1 hover:border-amber-500/50 transition-all">
                  <Award className="w-5 h-5 text-amber-400 mx-auto" />
                  <h4 className="font-extrabold text-white text-xs mt-1">Top Academic Ranks</h4>
                  <p className="text-[10px] text-slate-400">Consistent 100% Board Pass Rate</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1 hover:border-purple-500/50 transition-all">
                  <Sparkles className="w-5 h-5 text-purple-400 mx-auto" />
                  <h4 className="font-extrabold text-white text-xs mt-1">GPS Transport</h4>
                  <p className="text-[10px] text-slate-400">Live Bus Tracking for Parents</p>
                </div>
              </div>

              {/* Campus Photo Gallery Preview Grid */}
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-sm text-white">Campus Infrastructure & Life</h4>
                    <p className="text-[11px] text-slate-400">A glimpse of our vibrant, technologically equipped environment</p>
                  </div>
                  <button
                    onClick={() => setSiteTab('GALLERY')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    View All Photos <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {galleryItems.slice(0, 4).map((g, idx) => (
                    <div key={g.id || ("thumb-" + idx)} className="relative rounded-2xl overflow-hidden group border border-slate-800 bg-slate-950">
                      <img src={g.url} alt={g.title} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-[10px] font-bold text-white leading-tight">{g.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Principal Message & School Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase">
                    <Award className="w-4 h-4" /> Principal's Desk Message
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed italic">
                    "Welcome to {branding.name}. Our objective is to combine academic excellence with high moral values, ensuring every child receives the tools, mentorship, and encouragement to realize their highest potential."
                  </p>
                  <div className="pt-2 border-t border-slate-800">
                    <p className="font-extrabold text-white">{branding.principalName}</p>
                    <p className="text-[10px] text-slate-400">Principal & Academic Director</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-indigo-400 text-xs">Official Contact & Admissions Helpline</h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {branding.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {branding.email}
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{branding.address}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROMOTIONAL VIDEO DEDICATED SHOWCASE */}
          {siteTab === 'VIDEO' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-rose-950/60 to-slate-900 p-6 rounded-3xl border border-rose-900/40 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
                  <Video className="w-4 h-4" /> Official Campus Tour & Video Experience
                </div>
                <h3 className="text-xl font-black text-white">{promoVideoTitle}</h3>
                <p className="text-slate-300 text-xs">
                  हमारे स्कूल का आधुनिक शैक्षणिक परिवेश, डिजिटल क्लासरूम, रोबोटिक्स लैब और खेल सुविधाएं देखें।
                </p>
              </div>

              {/* Full Width Video Frame */}
              <div className="aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl relative">
                {promoVideoUrl.includes('youtube.com') || promoVideoUrl.includes('youtu.be') ? (
                  <iframe
                    src={getEmbedVideoUrl(promoVideoUrl)}
                    title={promoVideoTitle}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <img src={promoVideoPoster} alt="Video Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                      <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-2xl">
                        <Play className="w-8 h-8 fill-white translate-x-0.5" />
                      </div>
                      <p className="text-sm font-bold text-white">Play High-Definition Video Tour</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Key Takeaways */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <h5 className="font-extrabold text-white text-xs">🎓 50+ Smart Classrooms</h5>
                  <p className="text-[11px] text-slate-400">Fully air-conditioned classrooms with 4K touch displays and digital content.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <h5 className="font-extrabold text-white text-xs">🔬 STEM & Robotics Center</h5>
                  <p className="text-[11px] text-slate-400">Hands-on coding, 3D printing and science experimentation from Grade III.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <h5 className="font-extrabold text-white text-xs">🚌 100% GPS Safe Transport</h5>
                  <p className="text-[11px] text-slate-400">Parent live tracking mobile app, female attendants and CCTV coverage on all buses.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAMPUS PHOTO GALLERY */}
          {siteTab === 'GALLERY' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Campus Photo Gallery</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Explore our infrastructure, laboratories, sports grounds and student events.</p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
                  {['ALL', 'Campus', 'Classrooms', 'Labs', 'Sports', 'Library'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedGalleryCategory(cat)}
                      className={`px-3 py-1 rounded-xl font-bold transition-all ${
                        selectedGalleryCategory === cat ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredGallery.map((item, idx) => (
                  <div key={item.id || ("item-" + idx)} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden group shadow-lg">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-300 border border-slate-700">
                        {item.category}
                      </span>
                    </div>
                    <div className="p-4 space-y-1">
                      <h5 className="font-extrabold text-white text-xs">{item.title}</h5>
                      <p className="text-[10px] text-slate-400">ABC Public School Campus Facility</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE ONLINE ADMISSION & MARKETING INQUIRY FORM */}
          {siteTab === 'ADMISSION' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-950/60 to-slate-900 p-6 rounded-3xl border border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                  <UserPlus className="w-4 h-4" /> Direct Online Admission & Lead Generation Form
                </div>
                <h3 className="text-xl font-black text-white">Apply for Admission (Academic Session {branding.academicSession})</h3>
                <p className="text-slate-300 text-xs">
                  छात्र या अभिभावक सीधे इस फॉर्म को भरकर आवेदन करें। फॉर्म सबमिट होते ही स्कूल के मुख्य नंबर से आपके व्हाट्सएप पर डिजिटल प्रॉस्पेक्टस और एडमिशन किट भेज दी जाएगी।
                </p>
              </div>

              {submittedApplicationNo ? (
                <div className="bg-emerald-950/80 border border-emerald-600/80 p-8 rounded-3xl text-center space-y-4 animate-fade-in shadow-xl">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">आवेदन सफलतापूर्वक दर्ज हो गया!</h4>
                    <p className="text-emerald-300 text-xs mt-1">
                      एप्लीकेशन रजिस्ट्रेशन नंबर: <b className="font-mono text-white text-base bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-700">{submittedApplicationNo}</b>
                    </p>
                    <p className="text-slate-300 text-xs max-w-md mx-auto mt-2">
                      आपके व्हाट्सएप नंबर पर स्कूल की तरफ से ऑटो-कन्फर्मेशन एवं डिजिटल ब्रोशर भेज दिया गया है। स्कूल एडमिशन सेल जल्द ही आपसे संपर्क करेगी।
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => setShowWhatsAppModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" /> व्हाट्सएप संदेश देखें (View Auto-Message)
                    </button>
                    <button
                      onClick={() => setSubmittedApplicationNo(null)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                    >
                      नया फॉर्म भरें
                    </button>
                    <button
                      onClick={() => setSiteTab('HOME')}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                    >
                      होम पेज
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAdmissionSubmit} className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">छात्र का पूरा नाम (Student Name) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aryan Kumar"
                        value={admForm.studentName}
                        onChange={(e) => setAdmForm({ ...admForm, studentName: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">किस क्लास में एडमिशन चाहिए (Applying Class) *</label>
                      <select
                        value={admForm.applyingClass}
                        onChange={(e) => setAdmForm({ ...admForm, applyingClass: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                      >
                        <option value="Class Nursery">Class Nursery</option>
                        <option value="Class I">Class I</option>
                        <option value="Class II">Class II</option>
                        <option value="Class III">Class III</option>
                        <option value="Class IV">Class IV</option>
                        <option value="Class V">Class V</option>
                        <option value="Class VI">Class VI</option>
                        <option value="Class VII">Class VII</option>
                        <option value="Class VIII">Class VIII</option>
                        <option value="Class IX">Class IX</option>
                        <option value="Class X">Class X</option>
                        <option value="Class XI">Class XI</option>
                        <option value="Class XII">Class XII</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">अभिभावक / माता-पिता का नाम *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={admForm.parentName}
                        onChange={(e) => setAdmForm({ ...admForm, parentName: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">व्हाट्सएप नंबर (WhatsApp No. for Auto Pack) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={admForm.whatsappNumber}
                        onChange={(e) => setAdmForm({ ...admForm, whatsappNumber: e.target.value, phone: admForm.phone || e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">कॉलिंग नंबर (Alternate Phone)</label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={admForm.phone}
                        onChange={(e) => setAdmForm({ ...admForm, phone: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">ईमेल पता (Email)</label>
                      <input
                        type="email"
                        placeholder="parent@gmail.com"
                        value={admForm.email}
                        onChange={(e) => setAdmForm({ ...admForm, email: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">पता / इलाका (Local Address / Locality) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kankarbagh Road, Near Colony Gate"
                        value={admForm.address}
                        onChange={(e) => setAdmForm({ ...admForm, address: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">शहर / जिला (City / District) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Patna"
                        value={admForm.city}
                        onChange={(e) => setAdmForm({ ...admForm, city: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">पिछला स्कूल एवं प्राप्तांक (Previous School & %)</label>
                      <input
                        type="text"
                        placeholder="e.g. St. Joseph Convent (88% marks in previous year)"
                        value={admForm.previousSchool}
                        onChange={(e) => setAdmForm({ ...admForm, previousSchool: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">कोई विशेष आवश्यकता या प्रश्न (Remarks / Questions)</label>
                      <input
                        type="text"
                        placeholder="e.g. Interested in Hostel & School Bus Route 3"
                        value={admForm.remarks}
                        onChange={(e) => setAdmForm({ ...admForm, remarks: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> सबमिट करें और व्हाट्सएप पर प्रॉस्पेक्टस प्राप्त करें (Submit & Receive Prospectus)
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 5: FEES STRUCTURE */}
          {siteTab === 'FEES' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    {language === 'hi' ? 'पारदर्शी फीस संरचना' : 'Official Fee Structure'}
                  </h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {language === 'hi' ? `सत्र ${branding.academicSession} के लिए अधिकृत शुल्क विवरण` : `Authorized fee schedule for session ${branding.academicSession}`}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                      <th className="p-3.5">Fee Category</th>
                      <th className="p-3.5">Frequency</th>
                      <th className="p-3.5">Standard Amount</th>
                      <th className="p-3.5">Nature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {feeTypes.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-white">{f.name}</td>
                        <td className="p-3.5 text-slate-400">{f.frequency}</td>
                        <td className="p-3.5 font-mono font-bold text-amber-400">₹{f.amount.toLocaleString()}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            f.isOptional ? 'bg-slate-800 text-slate-300' : 'bg-indigo-950 text-indigo-300'
                          }`}>
                            {f.isOptional ? 'Optional' : 'Compulsory'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: NOTICES */}
          {siteTab === 'NOTICES' && (
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-white">
                {language === 'hi' ? 'स्कूल सूचना पट्ट' : 'Official Notice Board'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 font-bold text-[10px] rounded-md">Urgent Notice</span>
                    <span className="text-[10px] text-slate-500 font-mono">10 Oct 2026</span>
                  </div>
                  <h5 className="font-extrabold text-white text-xs">Term-1 Examination Timetable Released</h5>
                  <p className="text-slate-400 text-[11px]">
                    All students of Class VI to XII must check their exam schedules on their student portals.
                  </p>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 font-bold text-[10px] rounded-md">Sports & Events</span>
                    <span className="text-[10px] text-slate-500 font-mono">08 Oct 2026</span>
                  </div>
                  <h5 className="font-extrabold text-white text-xs">Annual Inter-School Football Tournament</h5>
                  <p className="text-slate-400 text-[11px]">
                    Selections will begin next Monday in the main school playground at 07:00 AM.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: QUICK PORTAL ACCESS GATEWAY */}
          {siteTab === 'PORTAL_LOGIN' && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <h4 className="text-lg font-black text-white">स्कूल पोर्टल डायरेक्ट लॉगिन (Authorized Portal Gateway)</h4>
                <p className="text-slate-400 text-xs">
                  अपनी भूमिका चुनें और सीधे अपने डिजिटल डैशबोर्ड में प्रवेश करें।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 text-center hover:border-purple-500/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto font-bold">
                    🎓
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white text-xs">Student Portal</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">होमवर्क, ऑनलाइन टेस्ट, किताबें और रिजल्ट</p>
                  </div>
                  <button
                    onClick={() => handlePortalQuickLogin('STUDENT', 'homework_learning')}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Enter Student Portal
                  </button>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 text-center hover:border-cyan-500/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto font-bold">
                    👨‍👩‍👧
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white text-xs">Parent Portal</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">फीस भुगतान, हाजिरी अलर्ट, लीव एप्लीकेशन</p>
                  </div>
                  <button
                    onClick={() => handlePortalQuickLogin('PARENT', 'fee_management')}
                    className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Enter Parent Portal
                  </button>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 text-center hover:border-amber-500/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto font-bold">
                    👩‍🏫
                  </div>
                  <div>
                    <h5 className="font-extrabold text-white text-xs">Teacher Portal</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">दैनिक हाजिरी, होमवर्क और AI टेस्ट पेपर</p>
                  </div>
                  <button
                    onClick={() => handlePortalQuickLogin('TEACHER', 'attendance_timetable')}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Enter Teacher Portal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Simulated Instant Auto-Message Modal */}
      {showWhatsAppModal && lastSubmittedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
            {/* WhatsApp App Header */}
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  🏫
                </div>
                <div>
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    {branding.name} Admissions <Check className="w-3.5 h-3.5 text-emerald-300" />
                  </h4>
                  <p className="text-[10px] text-emerald-200">Official School Number: {branding.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 bg-[#0b141a] space-y-3 min-h-[220px]">
              <div className="text-center">
                <span className="bg-slate-800 text-slate-400 text-[10px] px-3 py-1 rounded-full">
                  Automated Lead Nurturing Triggered Just Now
                </span>
              </div>

              {/* Incoming Message Bubble */}
              <div className="bg-[#202c33] text-slate-100 p-3.5 rounded-2xl rounded-tl-none border border-slate-700 space-y-2 text-xs max-w-[90%]">
                <p className="font-bold text-emerald-400 text-[11px]">
                  नमस्ते {lastSubmittedLead.parentName} जी,
                </p>
                <p className="text-[11px] leading-relaxed">
                  {branding.name} में {lastSubmittedLead.studentName} के प्रवेश ({lastSubmittedLead.className}) संबंधी जानकारी प्राप्त करने के लिए धन्यवाद!
                </p>
                <div className="bg-[#111b21] p-2.5 rounded-xl border border-slate-700 space-y-1.5 text-[10px]">
                  <p className="text-amber-400 font-bold">📄 आपका रजिस्ट्रेशन सं.: {lastSubmittedLead.applicationNo}</p>
                  <p className="text-indigo-300">📖 डिजिटल प्रॉस्पेक्टस देखें: {brochureUrl}</p>
                  <p className="text-emerald-300">📲 स्कूल वेब-ऐप डाउनलोड करें: https://{activeWebsiteUrl}/app</p>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  हमारे प्रवेश परामर्शदाता शीघ्र आपसे संपर्क करेंगे।<br />— प्रवेश विभाग, {branding.name}
                </p>
                <div className="text-right text-[9px] text-slate-400">Just now ✓✓</div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
              <a
                href={`https://wa.me/91${lastSubmittedLead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `नमस्ते ${lastSubmittedLead.parentName} जी, ${branding.name} में प्रवेश संबंधित जानकारी प्राप्त करने के लिए धन्यवाद!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow"
              >
                <MessageSquare className="w-4 h-4" /> Open in WhatsApp Web
              </a>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
