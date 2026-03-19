/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Scale, 
  FileText, 
  Search, 
  ChevronRight, 
  Gavel, 
  Info,
  Loader2,
  ArrowLeft,
  Languages,
  Briefcase,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { getArticleExplanation, searchConstitution, findRelevantArticlesForCase, getConstitutionalAmendments } from './services/geminiService';

type View = 'articles' | 'sections' | 'explanation' | 'lawyer-assistant' | 'amendments';

interface ArticleSummary {
  number: string;
  title: string;
}

const LANGUAGES = [
  { code: 'English', name: 'English' },
  { code: 'Hindi', name: 'हिन्दी' },
  { code: 'Bengali', name: 'বাংলা' },
  { code: 'Marathi', name: 'मराठी' },
  { code: 'Telugu', name: 'తెలుగు' },
  { code: 'Tamil', name: 'தமிழ்' },
  { code: 'Gujarati', name: 'ગુજરાતી' },
  { code: 'Urdu', name: 'اردو' },
  { code: 'Kannada', name: 'ಕನ್ನಡ' },
  { code: 'Malayalam', name: 'മലയാളം' },
];

const INDIAN_CONSTITUTION_PARTS = [
// ... existing parts ...
  { id: "I", title: "The Union and its Territory", articles: "1-4" },
  { id: "II", title: "Citizenship", articles: "5-11" },
  { id: "III", title: "Fundamental Rights", articles: "12-35" },
  { id: "IV", title: "Directive Principles of State Policy", articles: "36-51" },
  { id: "IV-A", title: "Fundamental Duties", articles: "51A" },
  { id: "V", title: "The Union", articles: "52-151" },
  { id: "VI", title: "The States", articles: "152-237" },
  { id: "VIII", title: "The Union Territories", articles: "239-242" },
  { id: "IX", title: "The Panchayats", articles: "243-243O" },
  { id: "IX-A", title: "The Municipalities", articles: "243P-243ZG" },
  { id: "X", title: "The Scheduled and Tribal Areas", articles: "244-244A" },
  { id: "XI", title: "Relations between the Union and the States", articles: "245-263" },
  { id: "XII", title: "Finance, Property, Contracts and Suits", articles: "264-300A" },
  { id: "XIII", title: "Trade, Commerce and Intercourse within the Territory of India", articles: "301-307" },
  { id: "XIV", title: "Services under the Union and the States", articles: "308-323" },
  { id: "XV", title: "Elections", articles: "324-329A" },
  { id: "XVI", title: "Special Provisions relating to Certain Classes", articles: "330-342" },
  { id: "XVII", title: "Official Language", articles: "343-351" },
  { id: "XVIII", title: "Emergency Provisions", articles: "352-360" },
  { id: "XIX", title: "Miscellaneous", articles: "361-367" },
  { id: "XX", title: "Amendment of the Constitution", articles: "368" },
];

const COMMON_ARTICLES: ArticleSummary[] = [
  { number: "1", title: "Name and territory of the Union" },
  { number: "14", title: "Equality before law" },
  { number: "19", title: "Protection of certain rights regarding freedom of speech, etc." },
  { number: "21", title: "Protection of life and personal liberty" },
  { number: "32", title: "Remedies for enforcement of rights conferred by this Part" },
  { number: "44", title: "Uniform civil code for the citizens" },
  { number: "51A", title: "Fundamental duties" },
  { number: "370", title: "Temporary provisions with respect to the State of Jammu and Kashmir (Abrogated)" },
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('articles');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArticleSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  // Lawyer Assistant State
  const [caseDescription, setCaseDescription] = useState('');
  const [caseAnalysis, setCaseAnalysis] = useState<string | null>(null);
  const [isAnalyzingCase, setIsAnalyzingCase] = useState(false);

  // Amendments State
  const [amendmentsData, setAmendmentsData] = useState<string | null>(null);
  const [isLoadingAmendments, setIsLoadingAmendments] = useState(false);
  const [amendmentQuery, setAmendmentQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchConstitution(searchQuery, selectedLanguage);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCaseAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseDescription.trim()) return;
    setIsAnalyzingCase(true);
    setCaseAnalysis(null);
    try {
      const analysis = await findRelevantArticlesForCase(caseDescription, selectedLanguage);
      setCaseAnalysis(analysis || "No relevant articles found for this case.");
    } catch (error) {
      console.error("Case analysis failed:", error);
      setCaseAnalysis("Error analyzing case. Please try again.");
    } finally {
      setIsAnalyzingCase(false);
    }
  };

  const fetchAmendments = async (query: string = "") => {
    setCurrentView('amendments');
    setIsLoadingAmendments(true);
    setAmendmentsData(null);
    try {
      const data = await getConstitutionalAmendments(query, selectedLanguage);
      setAmendmentsData(data || "No amendment data found.");
    } catch (error) {
      console.error("Failed to fetch amendments:", error);
      setAmendmentsData("Error loading amendment data. Please try again.");
    } finally {
      setIsLoadingAmendments(false);
    }
  };

  const fetchExplanation = async (articleNum: string) => {
    setSelectedArticle(articleNum);
    setCurrentView('explanation');
    setIsLoadingExplanation(true);
    setExplanation(null);
    try {
      const text = await getArticleExplanation(articleNum, selectedLanguage);
      setExplanation(text || "No explanation found.");
    } catch (error) {
      console.error("Failed to fetch explanation:", error);
      setExplanation("Error loading explanation. Please try again.");
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('articles')}>
            <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center text-white">
              <Scale size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none text-emerald-950">Samvidhan Pravah</h1>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mt-1">Constitutional Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-1 bg-stone-100 p-1 rounded-full">
              <button 
                onClick={() => setCurrentView('articles')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === 'articles' ? 'bg-white shadow-sm text-emerald-900' : 'text-stone-500 hover:text-stone-800'}`}
              >
                Articles
              </button>
              <button 
                onClick={() => setCurrentView('sections')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === 'sections' ? 'bg-white shadow-sm text-emerald-900' : 'text-stone-500 hover:text-stone-800'}`}
              >
                Parts
              </button>
              <button 
                onClick={() => fetchAmendments()}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === 'amendments' ? 'bg-white shadow-sm text-emerald-900' : 'text-stone-500 hover:text-stone-800'}`}
              >
                Amendments
              </button>
              <button 
                onClick={() => setCurrentView('lawyer-assistant')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === 'lawyer-assistant' ? 'bg-white shadow-sm text-emerald-900' : 'text-stone-500 hover:text-stone-800'}`}
              >
                Lawyer Assistant
              </button>
            </nav>

            {/* Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-full text-sm font-medium text-stone-700 hover:border-emerald-300 transition-all shadow-sm"
              >
                <Languages size={16} className="text-emerald-600" />
                <span>{LANGUAGES.find(l => l.code === selectedLanguage)?.name}</span>
              </button>
              
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-[60]"
                  >
                    <div className="py-2 max-h-64 overflow-y-auto">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLanguage(lang.code);
                            setShowLangMenu(false);
                            // Refresh current view if needed
                            if (selectedArticle) fetchExplanation(selectedArticle);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedLanguage === lang.code ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-stone-600 hover:bg-stone-50'}`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Navigation Buttons (Mobile) */}
        <div className="grid grid-cols-5 gap-1 mb-8 md:hidden">
          <button 
            onClick={() => setCurrentView('articles')}
            className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${currentView === 'articles' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-stone-200 text-stone-600'}`}
          >
            <Book size={16} />
            <span className="text-[8px] font-semibold">Articles</span>
          </button>
          <button 
            onClick={() => setCurrentView('sections')}
            className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${currentView === 'sections' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-stone-200 text-stone-600'}`}
          >
            <FileText size={16} />
            <span className="text-[8px] font-semibold">Parts</span>
          </button>
          <button 
            onClick={() => fetchAmendments()}
            className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${currentView === 'amendments' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-stone-200 text-stone-600'}`}
          >
            <History size={16} />
            <span className="text-[8px] font-semibold">Changes</span>
          </button>
          <button 
            onClick={() => setCurrentView('lawyer-assistant')}
            className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${currentView === 'lawyer-assistant' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-stone-200 text-stone-600'}`}
          >
            <Briefcase size={16} />
            <span className="text-[8px] font-semibold">Lawyer</span>
          </button>
          <button 
            onClick={() => setCurrentView('explanation')}
            className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${currentView === 'explanation' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-stone-200 text-stone-600'}`}
          >
            <Gavel size={16} />
            <span className="text-[8px] font-semibold">Cases</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {currentView === 'amendments' && (
            <motion.div 
              key="amendments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                    <History size={20} />
                  </div>
                  <h2 className="text-2xl font-serif italic">Constitutional Amendments</h2>
                </div>
                <p className="text-stone-600 text-sm max-w-2xl">
                  Track the evolution of the Indian Constitution. Search for specific amendments or browse recent changes that have shaped the legal landscape of the country.
                </p>
                
                <form onSubmit={(e) => { e.preventDefault(); fetchAmendments(amendmentQuery); }} className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search amendments (e.g., 101st Amendment, GST, Land Reform)..."
                    className="w-full bg-white border border-stone-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    value={amendmentQuery}
                    onChange={(e) => setAmendmentQuery(e.target.value)}
                  />
                </form>
              </section>

              {isLoadingAmendments ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-emerald-600" size={40} />
                  <p className="text-stone-500 font-medium animate-pulse">Fetching amendment history and article changes...</p>
                </div>
              ) : amendmentsData && (
                <motion.section 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-stone-200 rounded-3xl p-6 md:p-10 shadow-sm"
                >
                  <div className="prose prose-stone prose-emerald max-w-none">
                    <Markdown>{amendmentsData}</Markdown>
                  </div>
                </motion.section>
              )}
            </motion.div>
          )}
          {currentView === 'lawyer-assistant' && (
            <motion.div 
              key="lawyer-assistant"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                    <Briefcase size={20} />
                  </div>
                  <h2 className="text-2xl font-serif italic">Lawyer's Case Assistant</h2>
                </div>
                <p className="text-stone-600 text-sm max-w-2xl">
                  Describe your client's case or the incident in detail. Our AI assistant will analyze the situation and immediately suggest the most relevant Constitutional Articles and legal arguments.
                </p>
                
                <form onSubmit={handleCaseAnalysis} className="space-y-4">
                  <textarea 
                    placeholder="Describe the incident (e.g., A citizen was detained without being informed of the grounds for arrest...)"
                    className="w-full bg-white border border-stone-200 rounded-2xl p-5 min-h-[160px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm text-stone-800 placeholder:text-stone-400"
                    value={caseDescription}
                    onChange={(e) => setCaseDescription(e.target.value)}
                  />
                  <button 
                    disabled={isAnalyzingCase || !caseDescription.trim()}
                    className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10"
                  >
                    {isAnalyzingCase ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Analyzing Case Details...</span>
                      </>
                    ) : (
                      <>
                        <Scale size={20} />
                        <span>Find Relevant Articles & Sections</span>
                      </>
                    )}
                  </button>
                </form>
              </section>

              {caseAnalysis && (
                <motion.section 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-stone-200 rounded-3xl p-6 md:p-10 shadow-sm"
                >
                  <div className="prose prose-stone prose-emerald max-w-none">
                    <Markdown>{caseAnalysis}</Markdown>
                  </div>
                </motion.section>
              )}
            </motion.div>
          )}
          {currentView === 'articles' && (
            <motion.div 
              key="articles"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <section>
                <h2 className="text-2xl font-serif italic mb-6">Explore Articles</h2>
                <form onSubmit={handleSearch} className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by topic (e.g., Freedom of Speech, Equality)..."
                    className="w-full bg-white border border-stone-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="animate-spin text-emerald-600" size={20} />
                    </div>
                  )}
                </form>
              </section>

              {searchResults.length > 0 ? (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Search Results</h3>
                    <button onClick={() => setSearchResults([])} className="text-xs text-emerald-600 font-medium hover:underline">Clear</button>
                  </div>
                  <div className="grid gap-3">
                    {searchResults.map((article) => (
                      <ArticleCard key={article.number} article={article} onClick={() => fetchExplanation(article.number)} />
                    ))}
                  </div>
                </section>
              ) : (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-4">Commonly Referenced</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {COMMON_ARTICLES.map((article) => (
                      <ArticleCard key={article.number} article={article} onClick={() => fetchExplanation(article.number)} />
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {currentView === 'sections' && (
            <motion.div 
              key="sections"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-serif italic mb-6">Parts of the Constitution</h2>
              <div className="grid gap-4">
                {INDIAN_CONSTITUTION_PARTS.map((part) => (
                  <div key={part.id} className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-emerald-200 transition-all group shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Part {part.id}</span>
                        <h3 className="text-lg font-semibold text-stone-900 leading-tight">{part.title}</h3>
                        <p className="text-sm text-stone-500">Articles {part.articles}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                        <Info size={18} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'explanation' && (
            <motion.div 
              key="explanation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <button 
                  onClick={() => setCurrentView('articles')}
                  className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-serif italic">
                  {selectedArticle ? `Article ${selectedArticle} Analysis` : "Select an Article"}
                </h2>
              </div>

              {!selectedArticle ? (
                <div className="bg-stone-50 border border-dashed border-stone-300 rounded-3xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                    <Search size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-stone-900">No Article Selected</h3>
                    <p className="text-stone-500 max-w-xs mx-auto">Browse the articles or search for a specific one to see a detailed legal analysis and landmark cases.</p>
                  </div>
                  <button 
                    onClick={() => setCurrentView('articles')}
                    className="bg-emerald-900 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-emerald-800 transition-all"
                  >
                    Go to Articles
                  </button>
                </div>
              ) : isLoadingExplanation ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-emerald-600" size={40} />
                  <p className="text-stone-500 font-medium animate-pulse">Analyzing legal provisions and case law...</p>
                </div>
              ) : (
                <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-10 shadow-sm">
                  <div className="prose prose-stone prose-emerald max-w-none">
                    <Markdown>{explanation || ""}</Markdown>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-20 border-t border-stone-200 py-12 bg-stone-50">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-stone-400">
            <Scale size={20} />
            <span className="text-sm font-bold uppercase tracking-[0.2em]">Samvidhan Pravah</span>
          </div>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            This application uses AI to provide summaries and analysis of the Indian Constitution. 
            Always refer to the official Gazette of India for legal purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}

function ArticleCard({ article, onClick }: { article: ArticleSummary; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center justify-between p-5 bg-white border border-stone-200 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all group text-left w-full"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-emerald-900 font-bold text-lg group-hover:bg-emerald-50 transition-colors">
          {article.number}
        </div>
        <div className="space-y-0.5">
          <h4 className="font-semibold text-stone-900 leading-tight">{article.title}</h4>
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Article {article.number}</p>
        </div>
      </div>
      <ChevronRight className="text-stone-300 group-hover:text-emerald-600 transition-all" size={20} />
    </button>
  );
}
