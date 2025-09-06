import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, MapPin } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface IssueFormProps {
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export default function IssueForm({ onSubmit, isSubmitting = false }: IssueFormProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    categoryId: "",
    title: "",
    description: "",
    address: "",
    location: { lat: 0, lng: 0 },
    priority: "MEDIUM",
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/catalog/categories'],
    queryFn: () => apiClient.getCategories(),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + selectedFiles.length > 5) {
        toast({
          title: "Too many files",
          description: "You can only upload up to 5 photos.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Please enter your address manually.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
        setIsGettingLocation(false);
        toast({
          title: "Location detected",
          description: "Your current location has been set.",
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Unable to get location",
          description: "Please enter your address manually or check location permissions.",
          variant: "destructive",
        });
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.title || !formData.description) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      ...formData,
      files: selectedFiles,
      location: formData.location.lat !== 0 ? formData.location : undefined,
    });
  };

  const categoryIcons: Record<string, string> = {
    pothole: "🛣️",
    streetlight: "💡",
    garbage: "🗑️",
    water: "💧",
    electricity: "⚡",
    traffic: "🚦",
    parks: "🌳",
    other: "📝",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Issue Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Issue Category *</Label>
        <Select value={formData.categoryId} onValueChange={(value) => 
          setFormData({ ...formData, categoryId: value })
        }>
          <SelectTrigger data-testid="select-category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="flex items-center gap-2">
                  <span>{categoryIcons[category.code] || "📝"}</span>
                  {category.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Issue Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Issue Title *</Label>
        <Input
          id="title"
          placeholder="Brief description of the issue"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          data-testid="input-title"
        />
      </div>

      {/* Detailed Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Detailed Description *</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Provide more details about the issue, when you noticed it, and how it affects you or others..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          data-testid="textarea-description"
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="address">Location *</Label>
        <div className="flex space-x-2">
          <Input
            id="address"
            placeholder="Street address or landmark"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="flex-1"
            data-testid="input-address"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            data-testid="button-get-location"
          >
            <MapPin className="mr-2 h-4 w-4" />
            {isGettingLocation ? "Getting..." : "Use GPS"}
          </Button>
        </div>
        {formData.location.lat !== 0 && (
          <p className="text-xs text-muted-foreground">
            GPS: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
          </p>
        )}
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Photos (Optional)</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">Click to upload photos or drag and drop</p>
          <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each. Max 5 photos.</p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            data-testid="input-file-upload"
          />
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Select Files
          </Button>
        </div>
        
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected files:</p>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border border-border rounded">
                <span className="text-sm">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  data-testid={`button-remove-file-${index}`}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority Level */}
      <div className="space-y-3">
        <Label>Priority Level</Label>
        <RadioGroup
          value={formData.priority}
          onValueChange={(value) => setFormData({ ...formData, priority: value })}
        >
          <div className="grid grid-cols-3 gap-3">
            <Label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
              <RadioGroupItem value="LOW" className="mr-3" />
              <div>
                <div className="font-medium text-green-600">Low</div>
                <div className="text-xs text-muted-foreground">Non-urgent</div>
              </div>
            </Label>
            <Label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
              <RadioGroupItem value="MEDIUM" className="mr-3" />
              <div>
                <div className="font-medium text-orange-600">Medium</div>
                <div className="text-xs text-muted-foreground">Standard</div>
              </div>
            </Label>
            <Label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
              <RadioGroupItem value="HIGH" className="mr-3" />
              <div>
                <div className="font-medium text-red-600">High</div>
                <div className="text-xs text-muted-foreground">Urgent</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" className="w-full btn-primary" disabled={isSubmitting} data-testid="button-submit">
        {isSubmitting ? "Submitting..." : "Submit Report"}
      </Button>
    </form>
  );
}
