import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, MessageCircle, CheckCircle2, Star, 
  ChevronDown, ChevronUp, ShieldCheck, 
  ArrowRight, ExternalLink, Dog, Check, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function LandingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Enquiry Form State
  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    dogName: '',
    breedSize: '',
    serviceType: 'Boarding Stay',
    dropOffDate: '',
    pickUpDate: '',
    note: ''
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState('all');
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (idx) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Generate WhatsApp prefilled enquiry text
  const generateWhatsAppUrl = () => {
    const text = 
`Hi Pet Care,

I would like to enquire about pet boarding / services.

*Booking Details*
- Owner Name: ${formData.ownerName || '-'}
- Phone: ${formData.phone || '-'}
- Pet Name: ${formData.dogName || '-'}
- Breed / Size: ${formData.breedSize || '-'}
- Service: ${formData.serviceType}
- Drop-off Date: ${formData.dropOffDate || '-'}
- Pick-up Date: ${formData.pickUpDate || '-'}
- Care Notes: ${formData.note || '-'}

Please confirm room availability and pricing for these dates.
Thank you.`;

    return `https://wa.me/919847012345?text=${encodeURIComponent(text)}`;
  };

  const handleOnlineSubmit = (e) => {
    e.preventDefault();
    if (!formData.ownerName || !formData.phone || !formData.dogName || !formData.dropOffDate) {
      showToast('Please fill in all required fields (Owner Name, Phone, Dog Name, Drop-off Date)', 'warning');
      return;
    }

    setFormSubmitted(true);
    showToast('Enquiry received! Our sanctuary team will reach out to confirm your dates.', 'success');
  };

  // Gallery Photos
  const galleryItems = [
    {
      id: 1,
      category: 'suites',
      title: 'Restful Indoor Boarding Suite',
      subtitle: 'Spacious, hygienic, climate-managed kennel suite',
      url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 2,
      category: 'play',
      title: 'Secure Outdoor Play Yard',
      subtitle: 'Open-air agility and active socialization grounds',
      url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 3,
      category: 'guests',
      title: 'Golden Retriever at Morning Play',
      subtitle: 'Supervised playtime with clean hydration stations',
      url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 4,
      category: 'guests',
      title: 'Happy Labrador Settling In',
      subtitle: 'Personalized affection for calm and gentle routines',
      url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 5,
      category: 'suites',
      title: 'Cozy Rest Corner',
      subtitle: 'Clean orthopaedic bedding and soothing atmosphere',
      url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 6,
      category: 'play',
      title: 'Puppy Socialization Session',
      subtitle: 'Gentle introduction and energy release',
      url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 7,
      category: 'guests',
      title: 'Senior Dog Care Corner',
      subtitle: 'Peaceful rest and personalized medication support',
      url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 8,
      category: 'play',
      title: 'Evening Exercise & Walks',
      subtitle: 'Routine leash walks and secure perimeter movement',
      url: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  const filteredGallery = selectedGalleryCategory === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedGalleryCategory);

  // FAQs
  const faqs = [
    {
      q: 'What vaccinations are required before boarding?',
      a: 'To guarantee the safety of all pets at Pet Care, we require up-to-date Rabies, DHPP (Distemper/Parvo), and Bordetella vaccinations. Our automated CRM system validates expiry dates during check-in to keep the sanctuary healthy.'
    },
    {
      q: 'Can I bring my dog’s own food and bedding?',
      a: 'Yes! Bringing familiar food helps prevent dietary upset, and familiar bedding or a favorite toy helps your pet settle in calmly. Our staff logs every meal and follows your exact feeding portions.'
    },
    {
      q: 'Do you accept first-time boarders and puppies?',
      a: 'Yes, absolutely. We welcome first-time boarders and puppies. We provide dedicated "Calm Care Corners" with one-on-one attention, steady gentle handling, and short meet-and-greets so they feel safe and comfortable.'
    },
    {
      q: 'How will I receive daily photo and video updates?',
      a: 'Care updates, photos, and short video clips are shared directly with pet parents on WhatsApp. You will receive regular glimpses of your dog enjoying meals, play yard time, and resting peacefully.'
    },
    {
      q: 'Can your team administer prescription medications?',
      a: 'Yes. Our staff is trained to record and administer oral, topical, and prescription medications exactly as prescribed by your veterinarian. Every dose is logged in our real-time medical care register.'
    },
    {
      q: 'What are your drop-off and pick-up timings?',
      a: 'We are open 24 hours in Kakkanad, Kochi, Kerala! However, we recommend arranging drop-offs and pick-ups between 8:00 AM and 8:00 PM for the calmest intake transition for your pet.'
    }
  ];

  // Testimonials
  const reviews = [
    {
      name: 'Suby George',
      role: 'Pet Parent (Golden Retriever)',
      rating: 5,
      comment: 'One thing that really impressed us is the variety of dog cage sizes and clean facilities available. The staff genuinely loves animals and took wonderful care of our dog.',
      verified: 'Google Review'
    },
    {
      name: 'Sunil Agrawal',
      role: 'Pet Parent (German Shepherd)',
      rating: 5,
      comment: 'Dog’s cage area is very clean with no bad smell. Regular WhatsApp photos and videos were shared during the entire 7-day stay. Highly recommended in Kerala!',
      verified: 'Google Review'
    },
    {
      name: 'Reena Benny',
      role: 'Pet Parent (Labrador)',
      rating: 5,
      comment: 'Shadow was well cared for, happy, and clearly treated with love and attention. We had total peace of mind during our family vacation. Pet Care is truly a second home.',
      verified: 'Google Review'
    },
    {
      name: 'Arun & Kavitha',
      role: 'Pet Parents (Beagle Puppy)',
      rating: 5,
      comment: 'Our young puppy was boarding for the first time. The team handled his feeding schedule perfectly and gave him plenty of play yard socialization. Will definitely return!',
      verified: 'Verified Customer'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-brand-500 selection:text-white">
      


      {/* 2. MAIN STICKY NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <a href="#home" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition">
              <Dog size={24} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                Pet Care
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600 block">
                Sanctuary & Boarding
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-slate-600">
            <a href="#home" className="hover:text-brand-600 transition">Home</a>
            <a href="#about" className="hover:text-brand-600 transition">About</a>
            <a href="#facilities" className="hover:text-brand-600 transition">Facilities</a>
            <a href="#booking" className="hover:text-brand-600 transition">Booking</a>
            <a href="#reviews" className="hover:text-brand-600 transition">Reviews</a>
            <a href="#gallery" className="hover:text-brand-600 transition">Gallery</a>
            <a href="#faq" className="hover:text-brand-600 transition">FAQ</a>
            <a href="#contact" className="hover:text-brand-600 transition">Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {/* Direct Link to Login */}
            <Link 
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <span>LOGIN</span>
            </Link>

            {/* Main Booking Anchor */}
            <a 
              href="#booking"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-black uppercase tracking-wider bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/25 transition transform hover:-translate-y-0.5"
            >
              <MessageCircle size={15} />
              <span>Book Stay</span>
            </a>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section id="home" className="paw-pattern relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-brand-50/40 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-black uppercase tracking-[0.14em]">
                <ShieldCheck size={14} className="text-brand-600" />
                <span>Trusted Pet Sanctuary in Kerala</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
                Dog Boarding at <span className="text-brand-600">Pet Care</span> in Kakkanad, Kochi, Kerala
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-medium">
                Experience complete peace of mind with 24/7 supervised care, spacious indoor and outdoor boarding suites, veterinary health monitoring, and steady photo/video updates while your dog stays with us.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a 
                  href="#booking"
                  className="px-7 py-4 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-black text-sm uppercase tracking-[0.08em] shadow-lg shadow-brand-500/25 transition text-center hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>Check Availability</span>
                  <ArrowRight size={16} />
                </a>

                <a 
                  href="#facilities"
                  className="px-7 py-4 rounded-full border-2 border-slate-800 text-slate-800 hover:bg-slate-100 font-black text-sm uppercase tracking-[0.08em] transition text-center"
                >
                  Explore Facilities
                </a>
              </div>

              {/* Key Trust Signals */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-black text-brand-600">25+ Yrs</p>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">Pet Care Mastery</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">500+</p>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">Happy Regular Guests</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">24 / 7</p>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">Supervised Stays</p>
                </div>
              </div>
            </div>

            {/* Right Column: Layered Organic Visual Stage */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none h-[380px] sm:h-[450px]">
                
                {/* Background Card */}
                <div className="absolute top-0 right-0 w-[78%] h-[75%] rounded-[2.2rem] overflow-hidden border-4 border-white hero-organic-shadow transition transform hover:scale-[1.02] duration-500">
                  <img 
                    src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1000&q=80" 
                    alt="Dog guest at Pet Care" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="text-xs font-black uppercase tracking-wider bg-slate-900/80 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      Clean Suites
                    </span>
                  </div>
                </div>

                {/* Foreground Card */}
                <div className="absolute bottom-0 left-0 w-[78%] h-[75%] rounded-[2.2rem] overflow-hidden border-4 border-white hero-organic-shadow transition transform hover:scale-[1.02] duration-500 z-10">
                  <img 
                    src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1000&q=80" 
                    alt="Golden retriever guest enjoying care" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="text-xs font-black uppercase tracking-wider bg-brand-600/90 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      Spacious Play Yard
                    </span>
                  </div>
                </div>

                {/* Floating Rating Badge */}
                <div className="absolute -bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-black">
                    ★
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} fill="#F59E0B" stroke="#F59E0B" />
                      ))}
                    </div>
                    <p className="text-xs font-black text-slate-900 mt-0.5">4.9/5 on Google Reviews</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>



      {/* 5. ABOUT SECTION */}
      <section id="about" className="paw-pattern py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Image Card */}
            <div className="lg:col-span-5">
              <div className="rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-50 p-2.5 shadow-xl shadow-slate-200/50">
                <img 
                  src="https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=1000&q=80" 
                  alt="Labrador receiving personal care from Pet Care" 
                  className="rounded-[1.6rem] w-full h-[360px] sm:h-[420px] object-cover"
                />
              </div>
            </div>

            {/* Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">
                  About Pet Care
                </p>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Pet Care - Your pet's second home.
                </h2>
              </div>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Established in 2021, Pet Care is a trusted sanctuary for dogs and puppies in Kakkanad, Kochi, Kerala. With over 25 years of hands-on pet care experience, pets are cared for with safety, affection, and calm routines.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center mt-1 shrink-0">
                    <Check size={13} className="stroke-[3]" />
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-slate-700">
                    Clean, spacious, hygienic cage suites with daily sanitization and proper ventilation.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center mt-1 shrink-0">
                    <Check size={13} className="stroke-[3]" />
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-slate-700">
                    Dedicated play yard for daily movement, agility exercises, and supervised socialization.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center mt-1 shrink-0">
                    <Check size={13} className="stroke-[3]" />
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-slate-700">
                    Integrated digital health logs recording exact meal times, medications, and weight checks.
                  </p>
                </div>
              </div>

              {/* 3 Metric Badges */}
              <div className="mt-8 grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
                  <p className="text-2xl sm:text-3xl font-black text-brand-600">2021</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">Established Sanctuary</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
                  <p className="text-2xl sm:text-3xl font-black text-brand-600">25+</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">Years Pet Experience</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
                  <p className="text-2xl sm:text-3xl font-black text-brand-600">500+</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">Regular Pet Families</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FACILITIES & SERVICES SHOWCASE */}
      <section id="facilities" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600 mb-2">
              Facilities & Suites
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Indoor and outdoor cage facilities for safe stays.
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed font-medium">
              Premium cage facilities and attentive routines support day care, short-term boarding, and long-term boarding for dogs and puppies.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Facility 1 */}
            <div className="rounded-[1.6rem] border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-300 transition-all duration-300 group">
              <div className="h-52 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80" 
                  alt="Restful Boarding Suites" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  01
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">Restful Boarding Suites</h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  Premium indoor cage facilities give dogs and puppies a secure, clean, and restful place to settle during short-term and long-term stays.
                </p>
              </div>
            </div>

            {/* Facility 2 */}
            <div className="rounded-[1.6rem] border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-300 transition-all duration-300 group">
              <div className="h-52 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80" 
                  alt="Secure Play Yard" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  02
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">Secure Play Yard</h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  Outdoor cage facilities and open-air care spaces support fresh air, movement, and supervised engagement throughout the stay.
                </p>
              </div>
            </div>

            {/* Facility 3 */}
            <div className="rounded-[1.6rem] border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-300 transition-all duration-300 group">
              <div className="h-52 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80" 
                  alt="Calm Care Corners" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  03
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">Calm Care Corners</h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  Personalized affection, steady routines, and attentive handling help puppies, seniors, and first-time boarders feel safe.
                </p>
              </div>
            </div>

          </div>

          {/* Tag Pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {[
              'Indoor Cage Boarding',
              'Outdoor Play Yard',
              'Day Care Plans',
              'Short-Term Stays',
              'Long-Term Stays',
              'Puppy & Senior Care',
              'Medication Administration',
              'Daily Photo & Video Updates',
              '24/7 Supervised Staff'
            ].map((tag, idx) => (
              <span 
                key={idx}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-brand-500 hover:text-brand-600 transition"
              >
                {tag}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* 7. BOARDING ENQUIRY & WHATSAPP BOOKING */}
      <section id="booking" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600 mb-2">
              Boarding Enquiry
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Check availability in under a minute
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto">
              Share your dog's basic details and Pet Care will confirm availability and pricing directly on WhatsApp or phone.
            </p>
          </div>

          {/* Centered & Perfectly Aligned Boarding Enquiry Card */}
          <div className="max-w-3xl mx-auto">
            
            {/* Booking Form Card */}
            <div className="bg-white text-slate-900 rounded-[2rem] border border-slate-200 p-6 sm:p-10 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-black uppercase tracking-wider">
                  Direct Enquiry
                </span>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
                  No advance payment needed
                </span>
              </div>

              {formSubmitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Enquiry Sent Successfully!</h3>
                  <p className="text-sm font-medium text-slate-700 max-w-md mx-auto">
                    Thank you, {formData.ownerName}. We have logged your request. You can also open WhatsApp directly to get an instant reply:
                  </p>
                  <div className="pt-2">
                    <a 
                      href={generateWhatsAppUrl()} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-600 text-white font-black text-sm uppercase tracking-wider hover:bg-brand-700 shadow-md shadow-brand-500/25 transition"
                    >
                      <MessageCircle size={18} />
                      <span>Chat on WhatsApp Now</span>
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleOnlineSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Owner Name */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                        Owner Name <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input 
                        type="text"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Rachel Greenwood"
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15 transition shadow-xs"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                        Phone Number <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input 
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. 9847012345"
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15 transition shadow-xs"
                      />
                    </div>

                    {/* Dog Name */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                        Dog Name <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input 
                        type="text"
                        name="dogName"
                        value={formData.dogName}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Max"
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15 transition shadow-xs"
                      />
                    </div>

                    {/* Breed / Size */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                        Breed / Size
                      </label>
                      <input 
                        type="text"
                        name="breedSize"
                        value={formData.breedSize}
                        onChange={handleInputChange}
                        placeholder="e.g. Labrador / Medium"
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15 transition shadow-xs"
                      />
                    </div>

                    {/* Drop-off Date */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                        Drop-Off Date <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input 
                        type="date"
                        name="dropOffDate"
                        value={formData.dropOffDate}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15 transition shadow-xs"
                      />
                    </div>

                    {/* Pick-up Date */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                        Pick-Up Date
                      </label>
                      <input 
                        type="date"
                        name="pickUpDate"
                        value={formData.pickUpDate}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15 transition shadow-xs"
                      />
                    </div>

                  </div>

                  {/* Special Care / Dietary Notes */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                      Short Note / Special Care
                    </label>
                    <textarea 
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Any allergies, meal brand, medications, or special habits..."
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15 transition resize-y shadow-xs"
                    ></textarea>
                  </div>

                  {/* Enquiry Button */}
                  <div className="pt-2">
                    <a 
                      href={generateWhatsAppUrl()} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-center font-black text-base uppercase tracking-[0.08em] shadow-lg shadow-brand-500/30 transition transform hover:-translate-y-0.5"
                    >
                      Send Enquiry via WhatsApp
                    </a>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs font-bold text-slate-700">
                    No advance payment required. Pet Care confirms availability and pricing directly on WhatsApp.
                  </div>
                </form>
              )}
            </div>

            {/* Process Explainer: What happens next (Aligned cleanly beneath the card) */}
            <div className="mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-black text-sm mx-auto">
                    01
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Send WhatsApp Details</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your form opens directly as a clean pre-filled WhatsApp message.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-black text-sm mx-auto">
                    02
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Confirm Availability</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Pet Care replies with available suite slots, pricing, and confirmation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-black text-sm mx-auto">
                    03
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Safe Check-In</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bring your pet to the facility for a calm, supervised, and loving stay.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Sanctuary Highlights Banner */}
            <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Open 24 Hours / 365 Days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                <span>Kakkanad, Kochi, Kerala</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Daily WhatsApp Photo/Video Updates</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. REVIEWS & TESTIMONIALS */}
      <section id="reviews" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600 mb-2">
              Reviews & Testimonials
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Trusted by local pet families.
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed font-medium">
              Real Google review snippets displayed from verified pet parents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((review, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                    ))}
                  </div>
                  <blockquote className="text-sm text-slate-700 leading-relaxed font-medium italic">
                    "{review.comment}"
                  </blockquote>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200">
                  <p className="text-sm font-black text-slate-900">{review.name}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-0.5">
                    <span>{review.role}</span>
                    <span className="text-brand-700 font-bold">{review.verified}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 9. HAPPY GUESTS PHOTO GALLERY */}
      <section id="gallery" className="paw-pattern py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600 mb-2">
              Gallery
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Happy guests at Pet Care
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed font-medium">
              A glimpse of the dogs, suites, care spaces, and happy stays at Pet Care.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {[
              { id: 'all', label: 'All Photos' },
              { id: 'suites', label: 'Boarding Suites' },
              { id: 'play', label: 'Play Yard' },
              { id: 'guests', label: 'Happy Guests' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedGalleryCategory(tab.id)}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition ${
                  selectedGalleryCategory === tab.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredGallery.map(img => (
              <div 
                key={img.id}
                onClick={() => setActiveLightboxImage(img)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-slate-200 bg-white shadow-xs hover:shadow-lg transition"
              >
                <img 
                  src={img.url} 
                  alt={img.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-3 text-white">
                  <p className="text-xs font-black">{img.title}</p>
                  <p className="text-[10px] text-white/80 line-clamp-1">{img.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div 
            className="max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition"
            >
              <X size={18} />
            </button>
            <img 
              src={activeLightboxImage.url} 
              alt={activeLightboxImage.title}
              className="w-full max-h-[70vh] object-cover"
            />
            <div className="p-6 bg-white border-t border-slate-100">
              <h3 className="text-xl font-black text-slate-900">{activeLightboxImage.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{activeLightboxImage.subtitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* 10. FAQ ACCORDION */}
      <section id="faq" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600 mb-2">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Answers before you book.
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed font-medium">
              The final booking conversation happens on WhatsApp, but these cover the most common boarding questions.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className={`rounded-2xl border transition shadow-xs overflow-hidden ${
                    isOpen 
                      ? 'border-brand-200 bg-brand-50/20' 
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                  }`}
                >
                  <button 
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-black text-base text-slate-900 hover:text-brand-600 transition"
                  >
                    <span>{faq.q}</span>
                    <span className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 font-medium bg-white/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 11. CONTACT & ENQUIRIES (Comfortable 2-Card Balanced Layout) */}
      <section id="contact" className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600 mb-2">
              Direct Contact & Enquiries
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Get in touch with Pet Care
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed font-medium">
              Direct hotlines and WhatsApp chat for rapid reservation availability, stay confirmations, and boarding questions.
            </p>
          </div>

          {/* Balanced 2-Card Grid (No Awkward Gaps, Comfortable Presentation) */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Phone Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-4 shadow-sm hover:shadow-md hover:border-brand-300 transition group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center group-hover:scale-105 transition">
                  <Phone size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Direct Phone Hotline</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1">
                    Call our sanctuary manager directly for urgent inquiries, directions, or same-day boarding drop-offs.
                  </p>
                </div>
              </div>

              <div className="pt-3 space-y-2.5">
                <a 
                  href="tel:9847012345" 
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-brand-700 font-black hover:border-brand-500 hover:bg-brand-50/50 transition shadow-xs"
                >
                  <span className="text-base tracking-wide">+91 98470 12345</span>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-brand-700 bg-brand-100/70 px-2.5 py-1 rounded-md">
                    Hotline 1
                  </span>
                </a>
                <a 
                  href="tel:9847067890" 
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:border-brand-500 hover:bg-brand-50/50 transition shadow-xs"
                >
                  <span className="text-base tracking-wide">+91 98470 67890</span>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-md">
                    Hotline 2
                  </span>
                </a>
                <p className="text-[11px] text-slate-500 font-medium pt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Sanctuary line open 24/7 for urgent pet care
                </p>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#25D366] text-white shadow-md shadow-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition">
                  <MessageCircle size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">WhatsApp Chat Support</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1">
                    Send dates, questions, and pet photos for rapid room availability, photos of suites, and price confirmation.
                  </p>
                </div>
              </div>

              <div className="pt-3 space-y-2.5">
                <a 
                  href="https://wa.me/919847012345" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 p-3.5 rounded-xl shadow-md shadow-emerald-600/20 transition"
                >
                  <span>Chat on WhatsApp</span>
                  <ExternalLink size={15} />
                </a>
                <p className="text-[11px] text-center text-slate-500 font-medium pt-1 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Typically responds within minutes on WhatsApp
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 12. SANCTUARY FOOTER */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
            
            {/* Brand column */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                  <Dog size={22} />
                </div>
                <div>
                  <span className="text-xl font-black text-white">Pet Care</span>
                  <span className="block text-[11px] font-bold text-brand-400 uppercase tracking-wider">
                    Sanctuary & Boarding
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Safe dog boarding, day care, and short-term and long-term pet boarding in Kakkanad, Kochi, Kerala. Established in 2021 with over 25 years of hands-on pet care experience.
              </p>

              <div className="pt-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Open 24 hours / 365 days
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.14em] text-slate-200">
                Quick Links
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li><a href="#home" className="hover:text-white transition">Home</a></li>
                <li><a href="#about" className="hover:text-white transition">About Us</a></li>
                <li><a href="#facilities" className="hover:text-white transition">Facilities</a></li>
                <li><a href="#booking" className="hover:text-white transition">Enquiry</a></li>
                <li><a href="#reviews" className="hover:text-white transition">Google Reviews</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>

            {/* Boarding Services */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.14em] text-slate-200">
                Sanctuary Services
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-400">
                <li>• Indoor Cage Boarding</li>
                <li>• Outdoor Cage Boarding</li>
                <li>• Day Care Packages</li>
                <li>• Short-Term & Weekend Stays</li>
                <li>• Long-Term Boarding</li>
                <li>• Puppy & Senior Special Care</li>
              </ul>
            </div>

            {/* CRM Portal Access */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.14em] text-slate-200">
                Pet Care CRM
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clinic and sanctuary staff can access the operational dashboard for kennel occupancy, check-in checklists, and medication tracking.
              </p>
              <div className="pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition"
                >
                  <span>Go to Staff & Client Portal</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

          </div>

          {/* Copyright & Disclaimer */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Pet Care. All rights reserved.</p>
            <p>Kakkanad, Kochi, Kerala • Phone: +91 98470 12345 / +91 98470 67890</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
