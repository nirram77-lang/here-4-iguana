// ═══════════════════════════════════════════════════════════════════════════
// I4IGUANA - Internal Analytics Service
// Track page views, user activity, and engagement
// ═══════════════════════════════════════════════════════════════════════════

import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  doc,
  setDoc,
  getDoc,
  increment,
  limit
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PageView {
  page: string;
  section?: string;
  userId?: string;
  sessionId: string;
  timestamp: Timestamp;
  userAgent: string;
  referrer: string;
  screenSize: string;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalViews: number;
  uniqueVisitors: number;
  pageViews: { [page: string]: number };
  sectionViews: { [section: string]: number };
}

export interface AnalyticsSummary {
  today: {
    views: number;
    uniqueVisitors: number;
  };
  thisWeek: {
    views: number;
    uniqueVisitors: number;
  };
  thisMonth: {
    views: number;
    uniqueVisitors: number;
  };
  popularPages: { page: string; views: number }[];
  popularSections: { section: string; views: number }[];
  dailyTrend: { date: string; views: number }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Generate or get session ID
export const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = sessionStorage.getItem('i4iguana_session');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('i4iguana_session', sessionId);
  }
  return sessionId;
};

// Get today's date string
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get date string for N days ago
const getDateString = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// ═══════════════════════════════════════════════════════════════════════════
// TRACK PAGE VIEW
// ═══════════════════════════════════════════════════════════════════════════

export const trackPageView = async (
  page: string,
  section?: string,
  userId?: string
): Promise<void> => {
  try {
    if (typeof window === 'undefined') return;

    const sessionId = getSessionId();
    const today = getTodayString();

    // 1. Add detailed page view
    await addDoc(collection(db, 'analytics_pageviews'), {
      page,
      section: section || null,
      userId: userId || null,
      sessionId,
      timestamp: Timestamp.now(),
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct',
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    });

    // 2. Update daily stats
    const dailyRef = doc(db, 'analytics_daily', today);
    const dailyDoc = await getDoc(dailyRef);

    if (dailyDoc.exists()) {
      // Update existing
      const updates: any = {
        totalViews: increment(1),
        [`pageViews.${page}`]: increment(1),
      };
      if (section) {
        updates[`sectionViews.${section}`] = increment(1);
      }
      await setDoc(dailyRef, updates, { merge: true });
    } else {
      // Create new
      const newStats: any = {
        date: today,
        totalViews: 1,
        uniqueVisitors: 1,
        pageViews: { [page]: 1 },
        sectionViews: section ? { [section]: 1 } : {},
        sessions: [sessionId],
      };
      await setDoc(dailyRef, newStats);
    }

    // 3. Track unique visitor by session
    const sessionRef = doc(db, 'analytics_sessions', `${today}_${sessionId}`);
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) {
      await setDoc(sessionRef, {
        sessionId,
        date: today,
        firstVisit: Timestamp.now(),
        userId: userId || null,
      });
      // Increment unique visitors
      await setDoc(dailyRef, { uniqueVisitors: increment(1) }, { merge: true });
    }

    console.log(`📊 Tracked: ${page}${section ? ` > ${section}` : ''}`);
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// TRACK SECTION VIEW (for specific parts of a page)
// ═══════════════════════════════════════════════════════════════════════════

export const trackSectionView = async (
  section: string,
  userId?: string
): Promise<void> => {
  return trackPageView('website', section, userId);
};

// ═══════════════════════════════════════════════════════════════════════════
// GET ANALYTICS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  try {
    const today = getTodayString();
    const weekAgo = getDateString(7);
    const monthAgo = getDateString(30);

    // Get daily stats for the past 30 days
    const dailyQuery = query(
      collection(db, 'analytics_daily'),
      where('date', '>=', monthAgo),
      orderBy('date', 'desc')
    );
    const dailySnapshot = await getDocs(dailyQuery);
    
    let todayStats = { views: 0, uniqueVisitors: 0 };
    let weekStats = { views: 0, uniqueVisitors: 0 };
    let monthStats = { views: 0, uniqueVisitors: 0 };
    const pageViewsTotal: { [page: string]: number } = {};
    const sectionViewsTotal: { [section: string]: number } = {};
    const dailyTrend: { date: string; views: number }[] = [];

    dailySnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date;
      const views = data.totalViews || 0;
      const visitors = data.uniqueVisitors || 0;

      // Today
      if (date === today) {
        todayStats = { views, uniqueVisitors: visitors };
      }

      // This week
      if (date >= weekAgo) {
        weekStats.views += views;
        weekStats.uniqueVisitors += visitors;
      }

      // This month
      monthStats.views += views;
      monthStats.uniqueVisitors += visitors;

      // Aggregate page views
      if (data.pageViews) {
        Object.entries(data.pageViews).forEach(([page, count]) => {
          pageViewsTotal[page] = (pageViewsTotal[page] || 0) + (count as number);
        });
      }

      // Aggregate section views
      if (data.sectionViews) {
        Object.entries(data.sectionViews).forEach(([section, count]) => {
          sectionViewsTotal[section] = (sectionViewsTotal[section] || 0) + (count as number);
        });
      }

      // Daily trend (last 7 days)
      if (date >= weekAgo) {
        dailyTrend.push({ date, views });
      }
    });

    // Sort and get top pages/sections
    const popularPages = Object.entries(pageViewsTotal)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const popularSections = Object.entries(sectionViewsTotal)
      .map(([section, views]) => ({ section, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Sort daily trend chronologically
    dailyTrend.sort((a, b) => a.date.localeCompare(b.date));

    return {
      today: todayStats,
      thisWeek: weekStats,
      thisMonth: monthStats,
      popularPages,
      popularSections,
      dailyTrend,
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      today: { views: 0, uniqueVisitors: 0 },
      thisWeek: { views: 0, uniqueVisitors: 0 },
      thisMonth: { views: 0, uniqueVisitors: 0 },
      popularPages: [],
      popularSections: [],
      dailyTrend: [],
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GET RECENT PAGE VIEWS (for real-time display)
// ═══════════════════════════════════════════════════════════════════════════

export const getRecentPageViews = async (limitCount: number = 50): Promise<PageView[]> => {
  try {
    const recentQuery = query(
      collection(db, 'analytics_pageviews'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(recentQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        page: data.page || '',
        section: data.section || undefined,
        userId: data.userId || undefined,
        sessionId: data.sessionId || '',
        timestamp: data.timestamp,
        userAgent: data.userAgent || '',
        referrer: data.referrer || '',
        screenSize: data.screenSize || '',
      } as PageView;
    });
  } catch (error) {
    console.error('Error fetching recent views:', error);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PAGE NAME MAPPING (for display)
// ═══════════════════════════════════════════════════════════════════════════

export const PAGE_NAMES: { [key: string]: string } = {
  'website': '🌐 Landing Page',
  'website_hero': '🏠 Hero Section',
  'website_features': '✨ Features Section',
  'website_howitworks': '📖 How It Works',
  'website_download': '📥 Download Section',
  'website_partners': '🏢 For Venues (Business Card)',
  'website_contact': '📧 Contact Section',
  'website_footer': '📋 Footer',
  'app': '📱 App Main',
  'app_search': '🔍 Search Screen',
  'app_profile': '👤 Profile Screen',
  'app_chat': '💬 Chat Screen',
  'app_match': '💕 Match Screen',
  'app_checkin': '📍 Check-in Screen',
  'app_settings': '⚙️ Settings',
  'app_payment': '💳 Payment Screen',
  'admin': '🔐 Admin Panel',
};

export const getPageDisplayName = (page: string): string => {
  return PAGE_NAMES[page] || page;
};
