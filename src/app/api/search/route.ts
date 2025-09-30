import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.trim() === '') {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }

    const db = await getDatabase();
    const searchTerm = query.trim();
    const searchRegex = { $regex: searchTerm, $options: 'i' };

    const userFilter = session?.user?.email ? { userId: session.user.email } : {};

    const [tasks, todos, events, mails, activities] = await Promise.all([
      db.collection(Collections.TASKS)
        .find({
          ...userFilter,
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
            { tags: searchRegex },
          ],
        })
        .limit(limit)
        .toArray(),

      db.collection(Collections.TODOS)
        .find({
          ...userFilter,
          $or: [
            { text: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
          ],
        })
        .limit(limit)
        .toArray(),

      db.collection(Collections.CALENDAR_EVENTS)
        .find({
          ...userFilter,
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { location: searchRegex },
          ],
        })
        .limit(limit)
        .toArray(),
      db.collection(Collections.MAIL_DRAFTS)
        .find({
          ...userFilter,
          $or: [
            { subject: searchRegex },
            { body: searchRegex },
            { to: searchRegex },
          ],
        })
        .limit(limit)
        .toArray(),

      db.collection(Collections.ACTIVITIES)
        .find({
          ...userFilter,
          $or: [
            { title: searchRegex },
            { userPrompt: searchRegex },
          ],
        })
        .limit(limit)
        .toArray(),
    ]);

    const results = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasks: tasks.map((task: any) => ({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      todos: todos.map((todo: any) => ({
        id: todo.id,
        type: 'todo',
        title: todo.text,
        description: todo.description,
        priority: todo.priority,
        completed: todo.completed,
        dueDate: todo.dueDate,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events: events.map((event: any) => ({
        id: event.id,
        type: 'event',
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.startDate,
        status: event.status,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mails: mails.map((mail: any) => ({
        id: mail.id,
        type: 'mail',
        title: mail.subject,
        description: mail.body?.substring(0, 150) + '...',
        to: mail.to,
        priority: mail.priority,
        status: mail.status,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activities: activities.map((activity: any) => ({
        id: activity.id,
        type: 'activity',
        title: activity.title,
        description: activity.userPrompt,
        activityType: activity.type,
        count: activity.count,
        createdAt: activity.createdAt,
      })),
    };
    const totalResults =
      results.tasks.length +
      results.todos.length +
      results.events.length +
      results.mails.length +
      results.activities.length;

    return NextResponse.json({
      success: true,
      query: searchTerm,
      results,
      totalResults,
    });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
