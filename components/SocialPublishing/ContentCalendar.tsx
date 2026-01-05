// =============================================
// Content Calendar Component
// Visual calendar for scheduled posts
// =============================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
} from 'lucide-react';
import {
  socialPublishing,
  CalendarEvent,
  ScheduledPost,
  platformConfig,
} from '../../services/socialPublishingService';

// =============================================
// Types
// =============================================

interface ContentCalendarProps {
  onPostSelect?: (post: ScheduledPost) => void;
  onCreatePost?: (date: Date) => void;
  className?: string;
}

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

// =============================================
// Content Calendar Component
// =============================================

export const ContentCalendar: React.FC<ContentCalendarProps> = ({
  onPostSelect,
  onCreatePost,
  className = '',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventMenu, setShowEventMenu] = useState<string | null>(null);

  // =============================================
  // Data Loading
  // =============================================

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Add buffer days for adjacent month display
      startOfMonth.setDate(startOfMonth.getDate() - 7);
      endOfMonth.setDate(endOfMonth.getDate() + 7);

      const data = await socialPublishing.getCalendarEvents(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // Calendar Generation
  // =============================================

  const calendarDays = useMemo(() => {
    const days: DayCell[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDay = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        events: getEventsForDate(date),
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        events: getEventsForDate(date),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        events: getEventsForDate(date),
      });
    }

    return days;
  }, [currentDate, events]);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // =============================================
  // Navigation
  // =============================================

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // =============================================
  // Event Actions
  // =============================================

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await socialPublishing.deleteCalendarEvent(eventId);
      setEvents(events.filter((e) => e.id !== eventId));
      setShowEventMenu(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleCancelPost = async (postId: string) => {
    try {
      await socialPublishing.cancelScheduledPost(postId);
      loadEvents();
      setShowEventMenu(null);
    } catch (err) {
      console.error('Failed to cancel post:', err);
    }
  };

  const getStatusIcon = (status?: ScheduledPost['status']) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-3 h-3 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-400" />;
      case 'publishing':
        return <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3 text-zinc-500" />;
      default:
        return <Clock className="w-3 h-3 text-violet-400" />;
    }
  };

  const getEventColor = (event: CalendarEvent): string => {
    if (event.scheduled_post?.social_account) {
      return platformConfig[event.scheduled_post.social_account.platform].color;
    }
    return event.color || '#6366f1';
  };

  // =============================================
  // Render
  // =============================================

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`content-calendar ${className}`}>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-violet-400" />
              <h3 className="font-semibold text-zinc-200">Content Calendar</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800/50 text-zinc-400
                  hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              >
                Today
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400
                    hover:text-zinc-300 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="min-w-[140px] text-center text-sm font-medium text-zinc-200">
                  {monthYear}
                </span>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400
                    hover:text-zinc-300 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Week Day Headers */}
              <div className="grid grid-cols-7 gap-px mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="px-2 py-2 text-center text-xs font-medium text-zinc-500 uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-px bg-zinc-800/30 rounded-xl overflow-hidden">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-1.5 bg-zinc-900/50 relative group
                      ${!day.isCurrentMonth ? 'opacity-50' : ''}
                      ${day.isToday ? 'ring-2 ring-violet-500/50 ring-inset' : ''}
                    `}
                  >
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs
                          ${day.isToday
                            ? 'bg-violet-500 text-white font-bold'
                            : 'text-zinc-400'
                          }
                        `}
                      >
                        {day.date.getDate()}
                      </span>
                      <button
                        onClick={() => onCreatePost?.(day.date)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100
                          hover:bg-zinc-800 text-zinc-500 hover:text-zinc-400 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {day.events.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="relative group/event"
                        >
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              if (event.scheduled_post) {
                                onPostSelect?.(event.scheduled_post);
                              }
                            }}
                            className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-xs
                              truncate transition-colors hover:opacity-80"
                            style={{ backgroundColor: `${getEventColor(event)}20` }}
                          >
                            {event.scheduled_post && getStatusIcon(event.scheduled_post.status)}
                            <span
                              className="truncate"
                              style={{ color: getEventColor(event) }}
                            >
                              {event.title}
                            </span>
                          </button>

                          {/* Event Menu */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEventMenu(showEventMenu === event.id ? null : event.id);
                            }}
                            className="absolute right-0 top-0 p-0.5 rounded opacity-0 group-hover/event:opacity-100
                              bg-zinc-800 hover:bg-zinc-700 transition-all"
                          >
                            <MoreHorizontal className="w-3 h-3 text-zinc-400" />
                          </button>

                          {showEventMenu === event.id && (
                            <div className="absolute top-full right-0 mt-1 w-32 py-1 rounded-lg
                              bg-zinc-800 border border-zinc-700 shadow-xl z-20">
                              <button
                                onClick={() => {
                                  if (event.scheduled_post) {
                                    onPostSelect?.(event.scheduled_post);
                                  }
                                  setShowEventMenu(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs
                                  text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
                              <button
                                onClick={() => setShowEventMenu(null)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs
                                  text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </button>
                              {event.scheduled_post?.status === 'scheduled' && (
                                <button
                                  onClick={() => handleCancelPost(event.scheduled_post!.id)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs
                                    text-amber-400 hover:bg-zinc-700"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs
                                  text-red-400 hover:bg-zinc-700"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {day.events.length > 3 && (
                        <span className="text-xs text-zinc-500 pl-1.5">
                          +{day.events.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-violet-400" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>Published</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-red-400" />
            <span>Failed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 text-amber-400" />
            <span>Publishing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCalendar;
