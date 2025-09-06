import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiClient } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Camera, MapPin, Lightbulb, Check } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function ReportIssue() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    categoryId: "",
    title: "",
    description: "",
    address: "",
    location: { lat: 0, lng: 0 },
    priority: "MEDIUM",
    imageUrls: [] as string[],
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/catalog/categories'],
    queryFn: () => apiClient.getCategories(),
  });

  const { data: wards = [] } = useQuery({
    queryKey: ['/api/catalog/wards'],
    queryFn: () => apiClient.getWards(),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => apiClient.uploadFiles(files),
  });

  const createIssueMutation = useMutation({
    mutationFn: (issueData: any) => apiClient.createIssue(issueData),
    onSuccess: () => {
      toast({
        title: "Issue reported successfully!",
        description: "Thank you for reporting this issue. We'll keep you updated on its progress.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/issues/my'] });
      setLocation("/track");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to report issue",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.title || !formData.description) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload files first if any
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const uploadResult = await uploadMutation.mutateAsync(selectedFiles);
        imageUrls = uploadResult.urls;
      }

      // Create the issue
      const issueData = {
        ...formData,
        imageUrls,
        location: formData.location.lat !== 0 ? formData.location : undefined,
      };

      await createIssueMutation.mutateAsync(issueData);
    } catch (error) {
      console.error("Submit error:", error);
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3 mb-6">
        <Button variant="ghost" onClick={() => setLocation("/")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Report a Civic Issue</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Issue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                  <Button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={createIssueMutation.isPending || uploadMutation.isPending}
                    data-testid="button-submit-issue"
                  >
                    {createIssueMutation.isPending || uploadMutation.isPending ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Tips Card */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-secondary" />
                Reporting Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <Check className="text-success mt-1 mr-2 h-3 w-3" />
                  <span>Include clear photos from multiple angles</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-success mt-1 mr-2 h-3 w-3" />
                  <span>Provide exact location details</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-success mt-1 mr-2 h-3 w-3" />
                  <span>Describe the impact on daily life</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-success mt-1 mr-2 h-3 w-3" />
                  <span>Be specific about the problem</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* SLA Information */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Expected Resolution Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Potholes</span>
                  <span className="text-muted-foreground">7-14 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Street Lights</span>
                  <span className="text-muted-foreground">3-5 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Garbage</span>
                  <span className="text-muted-foreground">1-2 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Water Issues</span>
                  <span className="text-muted-foreground">2-4 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
