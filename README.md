# SurveyServe - Research Survey Platform

A comprehensive platform for deploying validated psychological and behavioral surveys with real-time scoring and analytics.

## Features

- **Validated Survey Library**: Collection of peer-reviewed instruments including PHQ-9, GAD-7, DASS-21, WHO-5, and more
- **Real-Time Scoring**: Automatic computation of survey scores using validated algorithms
- **Survey Management**: Create, customize, and manage survey deployments
- **Response Analytics**: Real-time monitoring of responses and scoring data
- **Secure & Compliant**: Anonymous data collection with consent management
- **Mobile Optimized**: Responsive design for all devices
- **Data Export**: Export responses and scores in multiple formats

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**
   The database will be automatically set up when you start the application. Migrations include:
   - Core survey and response tables
   - Research instruments from our validated library
   - Row-level security policies

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Research Instruments

SurveyServe includes a comprehensive library of validated research instruments:

### Mental Health Assessments
- **PHQ-9**: Patient Health Questionnaire for depression screening
- **GAD-7**: Generalized Anxiety Disorder assessment
- **DASS-21**: Depression, Anxiety and Stress Scale

### Well-being Measures
- **WHO-5**: World Health Organization Well-Being Index
- **WEMWBS**: Warwick-Edinburgh Mental Well-being Scale

### Personality & Individual Differences
- **BFI-10**: Big Five Inventory (short form)
- **Rosenberg Self-Esteem Scale**: Global self-worth assessment

### Occupational Health
- **Perceived Stress Scale (PSS-10)**: Stress perception measurement
- **MBI-HSS**: Maslach Burnout Inventory (research adaptation)

All instruments include:
- ✅ Validated scoring algorithms
- ✅ Normative data where available
- ✅ Psychometric properties
- ✅ Proper attribution and licensing

## Adding New Instruments

### Automatic Migration
New instruments are automatically checked and added on startup. The system:

1. Reads instruments from `data/research-instruments.json`
2. Checks existing database surveys
3. Creates migrations for missing instruments
4. Executes migrations automatically in development

### Manual Migration
To run instrument migration manually:

```bash
# Dry run (creates migration file only)
npm run migrate-instruments-dry-run

# Execute migration
npm run migrate-instruments
```

### Custom Instruments
Researchers can also create custom surveys through the web interface with:
- Custom questions and response options
- Flexible scoring rules (sum, average, threshold, flags)
- Real-time validation
- Immediate deployment

## Survey Management

### Creating Survey Links
1. Sign up/login as a researcher
2. Browse the survey library
3. Create a deployment link with options:
   - Response limits
   - Expiration dates
   - Anonymous vs identified responses
   - Consent requirements
   - Password protection
   - Results visibility

### Response Collection
- **Direct Links**: Share survey URLs directly
- **Embedded Surveys**: Embed in websites using provided code
- **QR Codes**: Generate for offline distribution
- **Password Protection**: Secure access when needed

### Analytics & Export
- Real-time response monitoring
- Automatic score computation
- Statistical summaries
- Clinical flagging for concerning scores
- CSV/JSON export capabilities

## Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security
- **Real-time subscriptions** for live updates

### Database Schema
- `surveys`: Validated instruments and custom surveys
- `survey_links`: Deployment configurations
- `responses`: Collected survey data
- `researchers`: User management
- `response_counts`: Efficient analytics

## Security & Privacy

### Data Protection
- Row Level Security (RLS) on all tables
- Encrypted data transmission
- Anonymous response collection
- Secure researcher authentication

### Compliance Features
- Informed consent management
- Data retention controls
- Export capabilities for data portability
- Audit trails for research integrity

### Privacy Controls
- Anonymous vs identified responses
- Participant data deletion
- Researcher data isolation
- Configurable result visibility

## Development

### Project Structure
```
src/
├── components/          # React components
├── contexts/           # React context providers
├── lib/               # Utilities and configuration
├── types/             # TypeScript type definitions
└── data/              # Research instruments data

scripts/
└── migrate-instruments.js  # Automatic migration tool

supabase/
└── migrations/        # Database schema migrations
```

### Key Components
- **Survey Library**: Browse and preview instruments
- **Survey Host**: Response collection interface
- **Dashboard**: Researcher management interface
- **Analytics**: Response monitoring and statistics

### Adding Features
1. Update database schema if needed
2. Add TypeScript types
3. Implement UI components
4. Add proper error handling
5. Include tests and documentation

## Licensing & Attribution

### Platform License
SurveyServe platform code is available under the MIT License.

### Research Instruments
Each instrument maintains its original licensing:
- **Public Domain**: WHO-5, PSS-10, Rosenberg Self-Esteem Scale
- **Research Use**: DASS-21, WEMWBS (free with attribution)
- **Adapted**: MBI concepts (original is copyrighted)

Always verify licensing requirements for your specific use case.

## Contributing

We welcome contributions to expand the research instrument library:

1. **Verify License**: Ensure instruments are public domain or freely available
2. **Add to JSON**: Include in `data/research-instruments.json`
3. **Validate Schema**: Follow existing data structure
4. **Test Migration**: Ensure automatic migration works
5. **Submit PR**: Include proper attribution and documentation

## Support

For questions about:
- **Platform Usage**: Check the documentation or create an issue
- **Research Instruments**: Verify original sources and licensing
- **Custom Development**: Contact for consultation services

## Acknowledgments

This platform builds upon decades of psychological research. We acknowledge:
- Original instrument developers and researchers
- Open science advocates promoting freely available tools
- The broader research community supporting reproducible science

---

**Note**: While SurveyServe provides validated instruments and scoring algorithms, results should always be interpreted by qualified professionals. This platform is for research and educational purposes.