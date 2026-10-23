import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  School
} from 'lucide-react';
import { PublicRoute } from '../../../types';
import { tenantsApi } from '../../../services/apiClient';

interface ContactPageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  isHindi?: boolean;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate, isHindi = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    schoolName: '',
    email: '',
    phone: '',
    category: 'k12-schools',
    students: '500',
    city: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.schoolName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError(isHindi ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await tenantsApi.submitApplication({
        schoolName: formData.schoolName,
        adminName: formData.name,
        adminEmail: formData.email,
        adminPhone: formData.phone,
        category: formData.category,
        estimatedStudents: Number(formData.students) || 300,
        city: formData.city || 'Patna',
        notes: formData.message || 'Contact page campus demo inquiry'
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(res.error || (isHindi ? 'सबमिशन विफल रहा। कृपया पुनः प्रयास करें।' : 'Submission failed. Please try again.'));
      }
    } catch {
      setError(isHindi ? 'कनेक्शन त्रुटि। कृपया बाद में प्रयास करें।' : 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12 font-sans">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
          {isHindi ? 'संपर्क व डेमो' : 'Institutional Advisory Desk'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {isHindi ? 'हमारे विशेषज्ञों से जुड़ें या कैंपस डेमो शेड्यूल करें' : 'Connect with our Education Advisors'}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          {isHindi
            ? 'चाहे डेटा माइग्रेशन हो, बायोमेट्रिक हार्डवेयर सेटअप हो या सब्सक्रिप्शन परामर्श — हमारा तकनीकी दल आपकी सहायता हेतु सदैव तत्पर है।'
            : 'Get a personalized institutional walkthrough, data migration guidance, or custom enterprise architecture proposals.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Column */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">
              {isHindi ? 'कार्यालय संपर्क' : 'Headquarters & Desk'}
            </h3>

            <div className="space-y-3 text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">i2A Technologies Pvt. Ltd.</div>
                  <div className="text-slate-400">Technology Innovation Hub, Patna, Bihar — 800001</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">+91 1800-890-4226</div>
                  <div className="text-slate-400">Toll Free (9:00 AM - 7:00 PM IST)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">support@i2a.in / sales@i2a.in</div>
                  <div className="text-slate-400">24-48 Hours Guaranteed Response SLA</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Monday — Saturday</div>
                  <div className="text-slate-400">9:00 AM — 7:00 PM IST</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-indigo-950/30 border border-indigo-700/40 text-xs space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <School className="w-4 h-4 text-indigo-400" />
              <span>{isHindi ? 'ऑन-साइट कैंपस भ्रमण' : 'On-Site Campus Audits'}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {isHindi
                ? '500+ छात्रों वाले स्कूलों हेतु हमारी तकनीकी टीम परिसर में आकर बायोमेट्रिक व वाई-फाई नेटवर्क का निःशुल्क ऑन-साइट सर्वे करती है।'
                : 'For institutions with 500+ students, our engineering field engineers conduct complimentary on-campus network & biometric audits.'}
            </p>
          </div>
        </div>

        {/* Inquiry Form Column */}
        <div className="md:col-span-2">
          <div className="p-7 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800">
            {submitted ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {isHindi ? 'पूछताछ सफलतापूर्वक प्राप्त हुई!' : 'Inquiry Submitted Successfully!'}
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {isHindi
                    ? 'हमारा शैक्षणिक सलाहकार दल 24 घंटों के भीतर आपके द्वारा दिए गए संपर्क नंबर पर संपर्क करेगा।'
                    : 'Our regional education advisor will contact your institution within 24 hours to schedule the demo.'}
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:text-white"
                >
                  {isHindi ? 'नया संदेश भेजें' : 'Send Another Message'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3">
                  {isHindi ? 'कैंपस डेमो व परामर्श फॉर्म' : 'Request a Campus Demo or Consultation'}
                </h3>

                {error && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isHindi ? 'आपका पूरा नाम *' : 'Contact Person Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isHindi ? 'स्कूल / संस्थान का नाम *' : 'Institution / School Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      placeholder="e.g. Delhi Public Academy"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isHindi ? 'आधिकारिक ईमेल *' : 'Official Email Address *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="principal@school.edu.in"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isHindi ? 'मोबाइल नंबर *' : 'Mobile / WhatsApp Phone *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isHindi ? 'संस्थान श्रेणी' : 'Institution Vertical'}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="k12-schools">K-12 Schools</option>
                      <option value="school-groups-trusts">School Groups & Trusts</option>
                      <option value="colleges-higher-ed">Colleges & Higher Ed</option>
                      <option value="coaching-institutes">Coaching Institutes</option>
                      <option value="tuition-centres">Tuition Centres</option>
                      <option value="preschools">Preschools</option>
                      <option value="sports-arts-academies">Sports & Arts Academies</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isHindi ? 'अनुमानित छात्र' : 'Student Strength'}
                    </label>
                    <input
                      type="number"
                      value={formData.students}
                      onChange={(e) => setFormData({ ...formData, students: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      {isHindi ? 'शहर / राज्य' : 'City & State'}
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Patna, Bihar"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isHindi ? 'आपकी आवश्यकताएं या विशेष प्रश्न' : 'Specific Requirements or Questions'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={isHindi ? 'उदा. हम 1200 छात्रों के लिए बायोमेट्रिक सिंक व सीबीएसई ग्रेडिंग रिपोर्ट कार्ड चाहते हैं...' : 'e.g., We have 12 buses needing live GPS and want to migrate from our legacy software...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? (isHindi ? 'भेजा जा रहा है...' : 'Submitting Inquiry...') : (isHindi ? 'कैंपस डेमो हेतु अनुरोध भेजें' : 'Submit Consultation Request')}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
