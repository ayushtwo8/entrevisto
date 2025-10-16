"use client"

import { useEffect, useState } from 'react';
import { Users, Briefcase, Plus, Search, Filter, ChevronDown, Edit, Trash2, Eye, MapPin, DollarSign } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface JobListProps {
    jobs: Array<{
        id: number;
        title: string;
        department: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        requiredSkills: string[];
        postedDate: string;
        applications: number;
        status: 'active' | 'closed';
    }>;
    onDelete: (id: number) => void;
    onEdit: (job: JobListProps['jobs'][number]) => void;
}

const CreateJobForm = ({ onJobCreated }: { onJobCreated: (job: JobListProps['jobs'][number]) => void }) => {
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    requiredSkills: []  
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      console.error("Error creating job:", await res.json());
      setLoading(false);
      return;
    }

    const newJob = await res.json();
    newJob.postedDate = new Date().toISOString();
    newJob.applications = 0;
    newJob.status = 'active';
    
    
    
    
    onJobCreated(newJob);
    setFormData({
      title: '',
      department: '',
      location: '',
      salary: '',
      description: '',
      requirements: '',
      requiredSkills: []
    });
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.name === 'requiredSkills' ? e.target.value.split(',').map(skill => skill.trim()) : e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
      <h2 className="text-2xl font-bold text-card-foreground mb-4">Create New Job</h2>
      
      <div>
        <label className="block text-sm font-medium text-card-foreground mb-2">Job Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Senior Frontend Developer"
          required
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g. Engineering"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Remote"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-card-foreground mb-2">Salary Range</label>
        <input
          type="text"
          name="salary"
          value={formData.salary}
          onChange={handleChange}
          placeholder="e.g. $120k - $150k"
          required
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-card-foreground mb-2">Job Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the role and responsibilities..."
          required
          rows={4}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-card-foreground mb-2">Requirements</label>
        <textarea
          name="requirements"
          value={formData.requirements}
          onChange={handleChange}
          placeholder="List the key requirements and qualifications..."
          required
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-card-foreground mb-2">Required Skills</label>
        <input
          type="text"
          name="requiredSkills"
          value={formData.requiredSkills.join(', ')}
          onChange={handleChange}
          placeholder="e.g. React, Node.js, SQL"
          required
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Create Job Posting
          </>
        )}
      </button>
    </form>
  );
};

const JobCard = ({ job, onDelete, onEdit }: { job: JobListProps['jobs'][number]; onDelete: (id: number) => void; onEdit: (job: JobListProps['jobs'][number]) => void; }) => (
  <div className="bg-card rounded-xl border border-border p-5 transition-all hover:shadow-lg hover:border-primary/30">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <h3 className="font-bold text-lg text-card-foreground">{job.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{job.department}</p>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        job.status === 'active' 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
      }`}>
        {job.status}
      </div>
    </div>

    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{job.location}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <DollarSign className="h-4 w-4" />
        <span>{job.salary}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{job.applications} applications</span>
      </div>
    </div>

    <div className="flex items-center gap-2 pt-3 border-t border-border">
      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
        <Eye className="h-4 w-4" />
        View
      </button>
      <button 
        onClick={() => onEdit(job)}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/80 transition-colors text-sm font-medium"
      >
        <Edit className="h-4 w-4" />
        Edit
      </button>
      <button 
        onClick={() => onDelete(job.id)}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const JobList = ({ jobs, onDelete, onEdit }: JobListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-card-foreground">Your Job Postings</h2>
        <div className="text-sm text-muted-foreground">
          {jobs.length} total posting{jobs.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search job titles or departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.map(job => (
          <JobCard key={job.id} job={job} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {jobs.length === 0 ? 'No job postings yet. Create your first one!' : 'No jobs found matching your criteria'}
          </p>
        </div>
      )}
    </div>
  );
};

export default function RecruiterDashboard() {
  const user = useUser();
  const userName = user.user?.firstName;
  
  const [jobs, setJobs] = useState<JobListProps['jobs']>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const jobsData = await res.json();
        setJobs(jobsData);
      } else {
        console.error("Error fetching jobs:", await res.json());
      }
    };
    fetchJobs();
  }, []);

  const handleJobCreated = (newJob: JobListProps['jobs'][number]) => {
    setJobs(prev => [newJob, ...prev]);
  };

  const handleDeleteJob = (jobId: number) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      setJobs(prev => prev.filter(job => job.id !== jobId));
    }
  };

  const handleEditJob = (job: JobListProps['jobs'][number]) => {
    alert(`Edit functionality for: ${job.title}`);
  };

  return (
    <div className="min-h-screen bg-background px-8">
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Recruiter Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back, {userName}. Manage your job postings below.</p>
        </div>

        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <CreateJobForm onJobCreated={handleJobCreated} />
          </div>

          <div className="lg:col-span-2">
            <JobList jobs={jobs} onDelete={handleDeleteJob} onEdit={handleEditJob} />
          </div>
        </div>
      </main>
    </div>
  );
}