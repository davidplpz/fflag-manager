import Link from 'next/link';

export default function Index() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 sm:p-24 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-sm text-primary-600 mb-4">
          <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2"></span>
          Feature Flags Platform
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
          Control your features with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-500">confidence</span>
        </h1>
        
        <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Manage, deploy, and monitor feature flags in real-time. Ship faster and reduce risk with our enterprise-grade feature management platform.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/login" 
            className="group inline-flex items-center justify-center rounded-full bg-primary-600 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Go to Platform
            <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          
          <a
            href="https://github.com/nrwl/nx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-all hover:bg-slate-50 hover:ring-slate-400"
          >
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
