import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
  useTransition,
} from 'react';
import {
  listTodos,
  deleteTodos,
  updateTodo,
  createTodo,
  updateTodoOrder,
} from '@/lib/api';
import type {
  Todo,
  Status,
  Priority,
  Category,
  TodoFilterInput,
  UpdateOrderInput,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  GripVertical,
  AlertCircle,
  X,
  Tag,
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUSES: Status[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'ARCHIVED',
  'CANCELLED',
];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const CATEGORIES: Category[] = [
  'WORK',
  'PERSONAL',
  'SHOPPING',
  'HEALTH',
  'FINANCE',
  'EDUCATION',
  'TRAVEL',
  'OTHER',
];

const statusColors: Record<Status, string> = {
  PENDING: 'text-yellow-700',
  IN_PROGRESS: 'text-blue-700',
  COMPLETED: 'text-green-700',
  ARCHIVED: 'text-gray-500',
  CANCELLED: 'text-red-700',
};

const statusBgColors: Record<Status, string> = {
  PENDING: 'bg-yellow-100',
  IN_PROGRESS: 'bg-blue-100',
  COMPLETED: 'bg-green-100',
  ARCHIVED: 'bg-gray-100',
  CANCELLED: 'bg-red-100',
};

const priorityColors: Record<Priority, string> = {
  LOW: 'text-gray-600',
  MEDIUM: 'text-blue-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600',
};

const priorityBgColors: Record<Priority, string> = {
  LOW: 'bg-gray-50',
  MEDIUM: 'bg-blue-50',
  HIGH: 'bg-orange-50',
  URGENT: 'bg-red-50',
};

const categoryColors: Record<Category, string> = {
  WORK: 'text-purple-700',
  PERSONAL: 'text-pink-700',
  SHOPPING: 'text-cyan-700',
  HEALTH: 'text-green-700',
  FINANCE: 'text-yellow-700',
  EDUCATION: 'text-indigo-700',
  TRAVEL: 'text-teal-700',
  OTHER: 'text-gray-700',
};

const categoryBgColors: Record<Category, string> = {
  WORK: 'bg-purple-100',
  PERSONAL: 'bg-pink-100',
  SHOPPING: 'bg-cyan-100',
  HEALTH: 'bg-green-100',
  FINANCE: 'bg-yellow-100',
  EDUCATION: 'bg-indigo-100',
  TRAVEL: 'bg-teal-100',
  OTHER: 'bg-gray-100',
};

const isOverdue = (todo: Todo): boolean => {
  if (
    !todo.dueDate ||
    todo.status === 'COMPLETED' ||
    todo.status === 'CANCELLED' ||
    todo.status === 'ARCHIVED'
  ) {
    return false;
  }
  return isPast(parseISO(todo.dueDate));
};

interface TodoRowProps {
  todo: Todo;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onDragStart: (todo: Todo) => void;
  onDragOver: (e: React.DragEvent, todo: Todo) => void;
  onDragEnd: () => void;
  dragOverId: string | null;
  isPending: boolean;
  index: number;
}

const TodoRow = memo(function TodoRow({
  todo,
  isSelected,
  onSelect,
  onStatusChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  dragOverId,
  isPending,
  index,
}: TodoRowProps) {
  const overdue = isOverdue(todo);
  const isDragging = useRef(false);

  const handleDragStart = () => {
    isDragging.current = true;
    onDragStart(todo);
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    onDragEnd();
  };

  return (
    <TableRow
      className={cn(
        'transition-all duration-200',
        isSelected && 'bg-primary/5',
        overdue && 'bg-red-50',
        dragOverId === todo.id && 'bg-blue-50 border-t-2 border-t-primary',
        'hover:bg-muted/50 hover:translate-x-1',
        'border-l-2 border-l-transparent hover:border-l-primary',
      )}
      style={{ animationDelay: `${index * 30}ms` }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => onDragOver(e, todo)}
      onDragEnd={handleDragEnd}
    >
      <TableCell className="w-[30px]">
        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground hover:text-foreground transition-colors" />
      </TableCell>
      <TableCell className="w-[50px]">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(todo.id, checked as boolean)}
        />
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-semibold">{todo.title}</div>
          {todo.subtitle && (
            <div className="text-sm text-muted-foreground font-mono">
              {todo.subtitle}
            </div>
          )}
          {todo.description && (
            <div className="text-xs text-muted-foreground max-w-md truncate">
              {todo.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {todo.category ? (
          <Badge
            className={cn(
              categoryBgColors[todo.category],
              categoryColors[todo.category],
              'border-0',
            )}
          >
            {todo.category}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        {todo.tags && todo.tags.length > 0 ? (
          <div className="flex gap-1 flex-wrap max-w-[200px]">
            {todo.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs font-mono">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {todo.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{todo.tags.length - 3}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        {todo.dueDate ? (
          <div
            className={cn(
              'text-sm font-mono',
              overdue && 'text-red-600 font-semibold',
            )}
          >
            <div className="flex items-center gap-2">
              <span>{format(parseISO(todo.dueDate), 'MMM dd')}</span>
              {overdue && <AlertCircle className="h-3 w-3" />}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge
          className={cn(
            priorityBgColors[todo.priority],
            priorityColors[todo.priority],
            'border-0 font-mono uppercase',
          )}
        >
          {todo.priority}
        </Badge>
      </TableCell>
      <TableCell>
        <Select
          value={todo.status}
          onValueChange={(v) => onStatusChange(todo.id, v as Status)}
        >
          <SelectTrigger className="w-[140px] h-8 font-mono text-xs">
            <Badge
              className={cn(
                statusBgColors[todo.status],
                statusColors[todo.status],
                'border-0',
              )}
            >
              {todo.status}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="font-mono">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="w-[60px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(todo.id)}
          disabled={isPending}
          className="hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

interface FilterButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const FilterButton = memo(function FilterButton({
  label,
  isSelected,
  onClick,
}: FilterButtonProps) {
  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="font-mono uppercase tracking-wider text-xs transition-all duration-200 hover:scale-105"
    >
      {label}
    </Button>
  );
});

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [prevTokens, setPrevTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedIdsRef = useRef<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const draggedItemRef = useRef<Todo | null>(null);
  const dragOverItemRef = useRef<Todo | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<Status[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<Category[]>([]);
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [newStatus, setNewStatus] = useState<Status>('PENDING');
  const [newCategory, setNewCategory] = useState<Category | ''>('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [newDueDate, setNewDueDate] = useState<Date | undefined>();

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filter = useMemo<TodoFilterInput | undefined>(() => {
    if (
      statusFilter.length === 0 &&
      priorityFilter.length === 0 &&
      categoryFilter.length === 0 &&
      !debouncedSearch &&
      !overdueFilter
    ) {
      return undefined;
    }
    return {
      status: statusFilter.length > 0 ? statusFilter : undefined,
      priority: priorityFilter.length > 0 ? priorityFilter : undefined,
      category: categoryFilter.length > 0 ? categoryFilter : undefined,
      search: debouncedSearch || undefined,
      overdue: overdueFilter || undefined,
    };
  }, [
    statusFilter,
    priorityFilter,
    categoryFilter,
    debouncedSearch,
    overdueFilter,
  ]);

  const loadTodos = useCallback(
    async (token?: string, isNext: boolean = true) => {
      setLoading(true);
      try {
        const result = await listTodos(10, token, filter);
        setTodos(result.items || []);
        setNextToken(result.nextToken);

        if (isNext && token) {
          setPrevTokens((prev) => [...prev, token]);
        }
        setSelectedIds(new Set());
        selectedIdsRef.current = new Set();
      } catch (error) {
        console.error('Failed to load todos:', error);
      } finally {
        setLoading(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    loadTodos(undefined, false);
  }, [loadTodos]);

  const handleNextPage = useCallback(() => {
    if (nextToken) {
      loadTodos(nextToken, true);
    }
  }, [nextToken, loadTodos]);

  const handlePrevPage = useCallback(() => {
    const lastToken = prevTokens[prevTokens.length - 1];
    setPrevTokens((prev) => prev.slice(0, -1));
    loadTodos(lastToken || undefined, false);
  }, [prevTokens, loadTodos]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const newSet = checked
        ? new Set(todos.map((t) => t.id))
        : new Set<string>();
      setSelectedIds(newSet);
      selectedIdsRef.current = newSet;
    },
    [todos],
  );

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((curr) => {
      const newSet = new Set(curr);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      selectedIdsRef.current = newSet;
      return newSet;
    });
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIdsRef.current);
    if (ids.length === 0) return;

    startTransition(async () => {
      try {
        await deleteTodos(ids);
        setSelectedIds(new Set());
        selectedIdsRef.current = new Set();
        loadTodos(prevTokens[prevTokens.length - 1] || undefined, false);
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    });
  }, [prevTokens, loadTodos]);

  const handleStatusChange = useCallback(
    async (id: string, newStatus: Status) => {
      startTransition(async () => {
        try {
          await updateTodo({ id, status: newStatus });
          setTodos((curr) =>
            curr.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
          );
        } catch (error) {
          console.error('Failed to update status:', error);
        }
      });
    },
    [],
  );

  const handleAddTag = useCallback(() => {
    if (newTagInput.trim() && !newTags.includes(newTagInput.trim())) {
      setNewTags((curr) => [...curr, newTagInput.trim()]);
      setNewTagInput('');
    }
  }, [newTagInput, newTags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setNewTags((curr) => curr.filter((t) => t !== tag));
  }, []);

  const handleAddTodo = useCallback(async () => {
    if (!newTitle.trim()) return;

    startTransition(async () => {
      try {
        await createTodo({
          title: newTitle,
          subtitle: newSubtitle,
          description: newDescription,
          priority: newPriority,
          status: newStatus,
          category: newCategory || undefined,
          tags: newTags.length > 0 ? newTags : undefined,
          dueDate: newDueDate ? newDueDate.toISOString() : undefined,
        });
        setNewTitle('');
        setNewSubtitle('');
        setNewDescription('');
        setNewCategory('');
        setNewTags([]);
        setNewDueDate(undefined);
        loadTodos(prevTokens[prevTokens.length - 1] || undefined, false);
      } catch (error) {
        console.error('Failed to create todo:', error);
      }
    });
  }, [
    newTitle,
    newSubtitle,
    newDescription,
    newPriority,
    newStatus,
    newCategory,
    newTags,
    newDueDate,
    prevTokens,
    loadTodos,
  ]);

  const toggleStatusFilter = useCallback((status: Status) => {
    setStatusFilter((curr) =>
      curr.includes(status)
        ? curr.filter((s) => s !== status)
        : [...curr, status],
    );
  }, []);

  const togglePriorityFilter = useCallback((priority: Priority) => {
    setPriorityFilter((curr) =>
      curr.includes(priority)
        ? curr.filter((p) => p !== priority)
        : [...curr, priority],
    );
  }, []);

  const toggleCategoryFilter = useCallback((category: Category) => {
    setCategoryFilter((curr) =>
      curr.includes(category)
        ? curr.filter((c) => c !== category)
        : [...curr, category],
    );
  }, []);

  const handleDragStart = useCallback((todo: Todo) => {
    draggedItemRef.current = todo;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, todo: Todo) => {
    e.preventDefault();
    dragOverItemRef.current = todo;
    setDragOverId(todo.id);
  }, []);

  const handleDragEnd = useCallback(async () => {
    const draggedItem = draggedItemRef.current;
    const dragOverItem = dragOverItemRef.current;

    if (!draggedItem || !dragOverItem || draggedItem.id === dragOverItem.id) {
      draggedItemRef.current = null;
      dragOverItemRef.current = null;
      setDragOverId(null);
      return;
    }

    const draggedIndex = todos.findIndex((t) => t.id === draggedItem.id);
    const overIndex = todos.findIndex((t) => t.id === dragOverItem.id);

    if (draggedIndex === -1 || overIndex === -1) {
      draggedItemRef.current = null;
      dragOverItemRef.current = null;
      setDragOverId(null);
      return;
    }

    const newTodos = [...todos];
    newTodos.splice(draggedIndex, 1);
    newTodos.splice(overIndex, 0, draggedItem);

    const updates: UpdateOrderInput[] = newTodos.map((todo, index) => ({
      id: todo.id,
      orderIndex: Date.now() + index,
    }));

    setTodos(newTodos);
    draggedItemRef.current = null;
    dragOverItemRef.current = null;
    setDragOverId(null);

    startTransition(async () => {
      try {
        for (const update of updates) {
          await updateTodoOrder(update);
        }
      } catch (error) {
        console.error('Failed to reorder:', error);
        loadTodos(prevTokens[prevTokens.length - 1] || undefined, false);
      }
    });
  }, [todos, prevTokens, loadTodos]);

  const handleDeleteOne = useCallback(
    (id: string) => {
      setSelectedIds(new Set([id]));
      selectedIdsRef.current = new Set([id]);
      handleDeleteSelected();
    },
    [handleDeleteSelected],
  );

  const currentPage = prevTokens.length + 1;
  const selectedCount = selectedIds.size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto py-12 px-6 space-y-12">
        <header className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Task Collection
              </h1>
              <p className="text-muted-foreground font-mono text-sm mt-2 tracking-wide">
                Organized productivity system
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-primary uppercase tracking-widest">
                Page {currentPage}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {todos.length} items displayed
              </div>
            </div>
          </div>
        </header>

        <section className="border-2 border-primary/20 rounded-lg p-6 bg-card shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full" />
          <h2 className="text-xl font-semibold mb-6 tracking-wide relative">
            New Entry
            <div className="absolute bottom-0 left-0 w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full -mb-2" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Title *
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter title..."
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Subtitle
              </label>
              <Input
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="Optional subtitle..."
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Priority
              </label>
              <Select
                value={newPriority}
                onValueChange={(v) => setNewPriority(v as Priority)}
              >
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="font-mono">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Status
              </label>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as Status)}
              >
                <SelectTrigger className="font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="font-mono">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Category
              </label>
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as Category)}
              >
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value=""
                    className="font-mono text-muted-foreground"
                  >
                    None
                  </SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="font-mono">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Due Date
              </label>
              <Popover>
                <PopoverTrigger className="w-full">
                  <Button
                    variant="outline"
                    className="w-full font-mono justify-start"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDueDate ? format(newDueDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDueDate}
                    onSelect={setNewDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Tags
              </label>
              <div className="flex gap-2">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="font-mono flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newTags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {newTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 font-mono"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddTodo}
                disabled={isPending || !newTitle.trim()}
                className="w-full font-mono uppercase tracking-wider"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Detailed description..."
              className="font-mono min-h-[80px] resize-none"
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="font-mono"
              />
            </div>
            <Button
              variant={overdueFilter ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setOverdueFilter((curr) => !curr)}
              className="font-mono uppercase tracking-wider gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Overdue
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Status Filter
              </div>
              <div className="flex gap-2 flex-wrap">
                {STATUSES.map((status) => (
                  <FilterButton
                    key={status}
                    label={status}
                    isSelected={statusFilter.includes(status)}
                    onClick={() => toggleStatusFilter(status)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Priority Filter
              </div>
              <div className="flex gap-2 flex-wrap">
                {PRIORITIES.map((priority) => (
                  <FilterButton
                    key={priority}
                    label={priority}
                    isSelected={priorityFilter.includes(priority)}
                    onClick={() => togglePriorityFilter(priority)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Category Filter
              </div>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((category) => (
                  <FilterButton
                    key={category}
                    label={category}
                    isSelected={categoryFilter.includes(category)}
                    onClick={() => toggleCategoryFilter(category)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border rounded-lg overflow-hidden shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[30px]"></TableHead>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedCount === todos.length && todos.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-mono uppercase tracking-widest text-xs">
                  Title
                </TableHead>
                <TableHead className="font-mono uppercase tracking-widest text-xs">
                  Category
                </TableHead>
                <TableHead className="font-mono uppercase tracking-widest text-xs">
                  Tags
                </TableHead>
                <TableHead className="font-mono uppercase tracking-widest text-xs">
                  Due
                </TableHead>
                <TableHead className="font-mono uppercase tracking-widest text-xs">
                  Priority
                </TableHead>
                <TableHead className="font-mono uppercase tracking-widest text-xs">
                  Status
                </TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="space-y-3">
                      <div className="animate-pulse h-4 w-24 mx-auto bg-muted rounded" />
                      <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                        Loading...
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : todos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="space-y-3">
                      <div className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
                        No entries found
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                todos.map((todo, index) => (
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    isSelected={selectedIds.has(todo.id)}
                    onSelect={handleSelect}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteOne}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    dragOverId={dragOverId}
                    isPending={isPending}
                    index={index}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </section>

        <footer className="flex items-center justify-between">
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={selectedCount === 0 || isPending}
            className="font-mono uppercase tracking-wider"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Selected ({selectedCount})
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrevPage}
              disabled={prevTokens.length === 0 || loading}
              className="font-mono uppercase tracking-wider"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={!nextToken || loading}
              className="font-mono uppercase tracking-wider"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
