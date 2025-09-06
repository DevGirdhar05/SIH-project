import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, X, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface SearchFilters {
  query: string;
  status: string;
  priority: string;
  category: string;
  ward: string;
  assignee: string;
  reporter: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags: string[];
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  categories: any[];
  wards: any[];
  users: any[];
  isLoading?: boolean;
}

export function AdvancedSearch({ 
  onSearch, 
  onClear, 
  categories, 
  wards, 
  users, 
  isLoading = false 
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: '',
    priority: '',
    category: '',
    ward: '',
    assignee: '',
    reporter: '',
    dateFrom: undefined,
    dateTo: undefined,
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      query: '',
      status: '',
      priority: '',
      category: '',
      ward: '',
      assignee: '',
      reporter: '',
      dateFrom: undefined,
      dateTo: undefined,
      tags: []
    });
    setTagInput('');
    onClear();
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'tags') return (value as string[]).length > 0;
    return value !== '' && value !== undefined;
  });

  return (
    <Card data-testid="advanced-search">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Advanced Search & Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Search */}
        <div className="space-y-2">
          <Label htmlFor="search-query">Search in title, description, and comments</Label>
          <Input
            id="search-query"
            placeholder="Enter keywords..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            data-testid="input-search-query"
          />
        </div>

        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="TRIAGED">Triaged</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="PENDING_USER_INFO">Pending Info</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger data-testid="select-priority">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Ward</Label>
            <Select value={filters.ward} onValueChange={(value) => handleFilterChange('ward', value)}>
              <SelectTrigger data-testid="select-ward">
                <SelectValue placeholder="All wards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All wards</SelectItem>
                {wards.map((ward) => (
                  <SelectItem key={ward.id} value={ward.id}>
                    {ward.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Select value={filters.assignee} onValueChange={(value) => handleFilterChange('assignee', value)}>
              <SelectTrigger data-testid="select-assignee">
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Anyone</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.filter(user => ['OFFICER', 'SUPERVISOR', 'ADMIN'].includes(user.role)).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reporter</Label>
            <Select value={filters.reporter} onValueChange={(value) => handleFilterChange('reporter', value)}>
              <SelectTrigger data-testid="select-reporter">
                <SelectValue placeholder="Any reporter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any reporter</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-date-from"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => handleFilterChange('dateFrom', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-date-to"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => handleFilterChange('dateTo', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              data-testid="input-tag"
            />
            <Button type="button" variant="outline" onClick={addTag} data-testid="button-add-tag">
              Add
            </Button>
          </div>
          {filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                    data-testid={`button-remove-tag-${tag}`}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
            className="flex-1"
            data-testid="button-search"
          >
            <Search className="mr-2 h-4 w-4" />
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
          
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={handleClear}
              data-testid="button-clear-filters"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">Active filters:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                
                let displayValue = value;
                if (key === 'dateFrom' || key === 'dateTo') {
                  displayValue = format(value as Date, 'MMM dd, yyyy');
                } else if (Array.isArray(value)) {
                  displayValue = value.join(', ');
                }

                return (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}: {displayValue}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}