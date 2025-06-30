# SurveyServe Design System

*A research-focused design system built for clarity, accessibility, and academic excellence*

## Design Philosophy

### Core Principles

**🎯 Research-First**
Every design decision prioritizes scientific rigor and data integrity. Clean, distraction-free interfaces allow researchers to focus on their work while maintaining participant engagement.

**📚 Academic Accessibility**
Designed for researchers and educators who prioritize function over form. Intuitive patterns reduce the learning curve and support diverse technical skill levels.

**🔬 Scientific Clarity**
Clear visual hierarchy guides users through complex research workflows. Consistent patterns reduce cognitive load during survey creation and data analysis.

**🌍 Universal Usability**
Meets WCAG 2.1 AA standards to ensure surveys are accessible to all participants, supporting inclusive research practices.

---

## Visual Identity

### Color Palette

Our color system is built around an indigo-purple gradient theme that reflects professionalism and scientific trust, enhanced with glass morphism effects for modern visual appeal.

#### Primary Colors (Indigo-Purple Theme)
```css
/* Primary Indigo */
--indigo-50: #eef2ff     /* Light backgrounds, subtle highlights */
--indigo-100: #e0e7ff    /* Icon backgrounds, light emphasis */
--indigo-500: #6366f1    /* Secondary actions, info states */
--indigo-600: #4f46e5    /* Primary actions, links */
--indigo-700: #4338ca    /* Hover states, active elements */

/* Primary Purple */
--purple-50: #faf5ff     /* Light purple backgrounds */
--purple-100: #f3e8ff    /* Purple icon backgrounds */
--purple-600: #9333ea    /* Purple accents, gradients */
--purple-700: #7c3aed    /* Purple hover states */

/* Gradient Combinations */
.bg-primary-gradient { @apply bg-gradient-to-r from-indigo-600 to-purple-600; }
.bg-hero-gradient { @apply bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50; }
.text-brand-gradient { @apply bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent; }
```

#### Supporting Colors (Tailwind Defaults)
```css
/* Blue Spectrum */
--blue-50: #eff6ff      /* Light blue backgrounds */
--blue-100: #dbeafe     /* Blue icon backgrounds */
--blue-600: #2563eb     /* Blue accents, analytics */

/* Gray Scale */
--gray-50: #f9fafb      /* Page backgrounds */
--gray-100: #f3f4f6     /* Card backgrounds */
--gray-200: #e5e7eb     /* Borders, dividers */
--gray-300: #d1d5db     /* Input borders */
--gray-400: #9ca3af     /* Placeholder text, icons */
--gray-600: #4b5563     /* Secondary text */
--gray-700: #374151     /* Primary interactive text */
--gray-900: #111827     /* Primary text, headings */
```

#### Semantic Colors
```css
--green-50: #f0fdf4     /* Success backgrounds */
--green-100: #dcfce7    /* Success icon backgrounds */
--green-500: #22c55e    /* Success states */
--green-600: #16a34a    /* Success actions */

--red-50: #fef2f2       /* Error backgrounds */
--red-100: #fee2e2      /* Error icon backgrounds */
--red-600: #dc2626      /* Error states, destructive actions */
--red-700: #b91c1c      /* Error hover states */

--amber-50: #fffbeb     /* Warning backgrounds */
--amber-100: #fef3c7    /* Warning icon backgrounds */
--amber-600: #d97706    /* Warning states */

--yellow-100: #fef9c3   /* Analytics icon backgrounds */
--yellow-600: #ca8a04   /* Analytics accents */
```

### Glass Morphism Design Language

Our signature visual style uses glass morphism effects to create depth and modern appeal while maintaining readability.

#### Glass Effect Utilities
```css
.glass-card {
  @apply bg-white/70 backdrop-blur-md border border-white/20;
}

.glass-nav {
  @apply bg-white/80 backdrop-blur-md;
}

.glass-modal {
  @apply bg-white/90 backdrop-blur-md;
}
```

### Typography

Typography prioritizes readability across devices and accommodates extended reading sessions common in research contexts.

#### Font Stack
```css
/* Using system fonts for optimal performance and native feel */
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

#### Type Scale (Tailwind)
```css
/* Headers - Clear hierarchy for research content */
.text-6xl { font-size: 3.75rem; line-height: 1; }      /* Hero titles */
.text-5xl { font-size: 3rem; line-height: 1; }        /* Page titles */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; } /* Section headers */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* Subsection headers */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }     /* Component titles */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }   /* Emphasized text */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }  /* Large body text */

/* Body text - Optimized for survey questions and content */
.text-base { font-size: 1rem; line-height: 1.5rem; }     /* Primary text */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }  /* Secondary text */
.text-xs { font-size: 0.75rem; line-height: 1rem; }      /* Labels, captions */
```

#### Font Weights
```css
.font-normal { font-weight: 400; }   /* Body text */
.font-medium { font-weight: 500; }   /* UI labels, nav links */
.font-semibold { font-weight: 600; } /* Card titles, emphasis */
.font-bold { font-weight: 700; }     /* Headings, strong emphasis */
```

---

## Layout & Spacing

### Grid System

Based on Tailwind's default 0.25rem (4px) spacing scale for consistent alignment.

```css
/* Spacing scale */
.space-1 { margin/padding: 0.25rem; }  /* 4px */
.space-2 { margin/padding: 0.5rem; }   /* 8px */
.space-3 { margin/padding: 0.75rem; }  /* 12px */
.space-4 { margin/padding: 1rem; }     /* 16px */
.space-6 { margin/padding: 1.5rem; }   /* 24px */
.space-8 { margin/padding: 2rem; }     /* 32px */
.space-12 { margin/padding: 3rem; }    /* 48px */
.space-16 { margin/padding: 4rem; }    /* 64px */
.space-20 { margin/padding: 5rem; }    /* 80px - section spacing */
```

### Breakpoints
```css
/* Tailwind breakpoints */
sm: '640px'   /* Tablets */
md: '768px'   /* Small laptops */
lg: '1024px'  /* Desktop */
xl: '1280px'  /* Large screens */
2xl: '1536px' /* Ultra-wide displays */
```

### Container Widths
```css
.max-w-md { max-width: 28rem; }    /* 448px - Auth forms */
.max-w-2xl { max-width: 42rem; }   /* 672px - Survey forms */
.max-w-4xl { max-width: 56rem; }   /* 896px - Hero content */
.max-w-7xl { max-width: 80rem; }   /* 1280px - Main layout */
```

---

## Components

### Buttons

#### Primary Button (Gradient)
```jsx
// For main actions (Create Survey, Save Changes, Submit Response)
className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
```

#### Primary Button (Solid)
```jsx
// For simple primary actions
className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
```

#### Secondary Button
```jsx
// For secondary actions (Cancel, Preview, Export)
className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200"
```

#### Destructive Button
```jsx
// For dangerous actions (Delete Survey, Remove Data)
className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
```

#### Text Button
```jsx
// For subtle actions and links
className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
```

### Form Controls

#### Text Input
```jsx
className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
```

#### Input with Icon
```jsx
// Container
<div className="relative">
  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
  <input className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" />
</div>
```

#### Form Label
```jsx
className="block text-sm font-medium text-gray-700 mb-2"
```

### Cards

#### Glass Card (Standard)
```jsx
className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200"
```

#### Glass Card (Interactive)
```jsx
className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 cursor-pointer"
```

#### Stat Card
```jsx
className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20"
```

#### Auth Card
```jsx
className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md border border-white/20"
```

### Navigation

#### Main Navigation
```jsx
className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
```

#### Brand Logo
```jsx
<span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
  SurveyServe
</span>
```

#### Navigation Link (Active)
```jsx
className="text-indigo-600 font-medium"
```

#### Navigation Link (Inactive)
```jsx
className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors duration-200"
```

### Status Indicators & Badges

#### Status Badge Base
```jsx
className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
```

#### Active Status
```jsx
className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
```

#### Draft Status
```jsx
className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800"
```

#### Subscription Badge
```jsx
className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full"
```

### Alerts & Notifications

#### Error Alert
```jsx
className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
```

#### Alert Content
```jsx
<AlertCircle className="h-5 w-5 text-red-600" />
<span className="text-red-700 text-sm">{message}</span>
```

### Loading States

#### Spinner
```jsx
className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
```

#### Button Loading
```jsx
{loading ? (
  <>
    <Loader2 className="h-5 w-5 animate-spin" />
    <span>Loading...</span>
  </>
) : (
  <span>Submit</span>
)}
```

---

## Layout Patterns

### Hero Section
```jsx
<section className="text-center py-20">
  <div className="max-w-4xl mx-auto">
    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
      {/* Title with gradient accent */}
    </h1>
    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
      {/* Description */}
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {/* CTA buttons */}
    </div>
  </div>
</section>
```

### Feature Grid
```jsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
  {features.map(feature => (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200">
      <div className="bg-indigo-100 rounded-lg p-3 w-fit mb-6">
        <Icon className="h-8 w-8 text-indigo-600" />
      </div>
      {/* Content */}
    </div>
  ))}
</div>
```

### Dashboard Stats
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {stats.map(stat => (
    <div className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
        </div>
        <div className={`p-3 rounded-lg ${stat.color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  ))}
</div>
```

---

## Icons & Imagery

### Icon System

Using **Lucide React** for consistent, research-appropriate iconography.

#### Core Icons
```jsx
// Navigation & Actions
<BarChart3 size={20} />      // Brand icon, analytics
<Home size={20} />           // Dashboard home
<Search size={20} />         // Search surveys
<Plus size={20} />           // Create new
<Settings size={20} />       // Configuration
<User size={20} />           // Profile/Account

// Research Specific
<FileText size={20} />       // Surveys/Documents
<Users size={20} />          // Participants/Responses
<Link size={20} />           // Survey links
<Shield size={20} />         // Privacy/Security
<Calendar size={20} />       // Time-based features
<CheckCircle size={20} />    // Completed/Validated
<AlertTriangle size={20} />  // Warnings/Attention

// Status & Feedback
<Crown size={20} />          // Premium features
<Lock size={20} />           // Secure/Private
<Globe size={20} />          // Public/Shared
<Eye size={20} />            // View/Preview
<LogOut size={20} />         // Sign out
<Mail size={20} />           // Email/Contact
<Loader2 size={20} />        // Loading states
<ArrowRight size={20} />     // CTAs, navigation
```

#### Icon Background Colors
```jsx
// Category-based icon backgrounds
"bg-indigo-100"    // Primary features
"bg-purple-100"    // Secondary features  
"bg-blue-100"      // Analytics, data
"bg-green-100"     // Success, completed
"bg-red-100"       // Errors, warnings
"bg-amber-100"     // Draft, pending
"bg-yellow-100"    // Analytics accent
```

---

## Accessibility Standards

### Color Contrast
- All text meets WCAG 2.1 AA standards (4.5:1 minimum)
- Interactive elements have sufficient contrast in all states
- Glass effects maintain readability with sufficient opacity

### Focus Management
```css
/* Consistent focus ring for all interactive elements */
.focus:ring-2 .focus:ring-indigo-500 .focus:ring-offset-2
```

### Screen Reader Support
- Semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- `aria-label` for icon-only buttons
- Proper heading hierarchy (h1 → h2 → h3)
- Form labels properly associated with inputs

### Keyboard Navigation
- All interactive elements keyboard accessible
- Logical tab order throughout interface
- Escape key closes modals and dropdowns
- Enter/Space activates buttons and controls

---

## Animation & Transitions

### Standard Transitions
```css
/* Smooth transitions for better perceived performance */
.transition-colors { transition: color 0.2s ease-in-out; }
.transition-all { transition: all 0.2s ease-in-out; }
```

### Hover Effects
```css
/* Card hover effects */
.hover:shadow-lg     /* Elevation increase */
.hover:shadow-xl     /* Strong elevation for CTAs */

/* Button hover effects */
.hover:from-indigo-700 .hover:to-purple-700  /* Gradient darkening */
.hover:bg-indigo-700                         /* Solid color darkening */
```

### Loading Animations
```css
.animate-spin        /* For loading spinners */
```

---

## Implementation Guidelines

### Background Pattern
```jsx
// Main app background
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
```

### Glass Card Pattern
```jsx
// Standard content card
<div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20">
```

### Section Spacing
```jsx
// Page sections
<div className="space-y-20">  {/* Large vertical spacing */}
<div className="space-y-8">   {/* Medium vertical spacing */}
<div className="space-y-4">   {/* Small vertical spacing */}
```

### Responsive Design
```jsx
// Mobile-first responsive classes
className="text-5xl md:text-6xl"                    // Typography scaling
className="grid md:grid-cols-2 lg:grid-cols-3"     // Grid responsive
className="flex flex-col sm:flex-row"              // Layout changes
className="px-4 sm:px-6 lg:px-8"                   // Padding responsive
```

---

## Conclusion

This design system reflects the actual implementation patterns used throughout SurveyServe, featuring a modern indigo-purple gradient theme enhanced with glass morphism effects. The system prioritizes visual appeal while maintaining accessibility and usability for research professionals.

Key characteristics:
- **Glass morphism** with semi-transparent backgrounds and backdrop blur
- **Indigo-purple gradient** theme for brand consistency
- **Tailwind CSS** utility classes for rapid development
- **Lucide React** icons for consistent iconography
- **Mobile-first** responsive design patterns

---

*This design system is kept in sync with the actual codebase implementation. Updates should be made to both the documentation and components simultaneously.* 