import React, { useState } from 'react';
import { SurveyLink, Survey } from '../../types/survey';
import { Code, Copy, Eye, Smartphone, Monitor, Tablet } from 'lucide-react';

interface ExtendedSurveyLink extends SurveyLink {
  survey: Survey;
}

interface EmbedCodeGeneratorProps {
  surveyLink: ExtendedSurveyLink;
}

export const EmbedCodeGenerator: React.FC<EmbedCodeGeneratorProps> = ({ surveyLink }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/survey/${surveyLink.link_code}?embed=true`;

  const iframeCode = `<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  scrolling="auto"
  title="${surveyLink.survey.title}">
</iframe>`;

  const responsiveIframeCode = `<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%;">
  <iframe 
    src="${embedUrl}" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    frameborder="0" 
    scrolling="auto"
    title="${surveyLink.survey.title}">
  </iframe>
</div>`;

  const javascriptCode = `<div id="surveystack-embed-${surveyLink.link_code}"></div>
<script>
  (function() {
    const iframe = document.createElement('iframe');
    iframe.src = '${embedUrl}';
    iframe.width = '100%';
    iframe.height = '600';
    iframe.frameBorder = '0';
    iframe.scrolling = 'auto';
    iframe.title = '${surveyLink.survey.title}';
    
    const container = document.getElementById('surveystack-embed-${surveyLink.link_code}');
    if (container) {
      container.appendChild(iframe);
    }
  })();
</script>`;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getPreviewDimensions = () => {
    switch (previewSize) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '600px' };
      case 'desktop':
        return { width: '100%', height: '600px' };
      default:
        return { width: '100%', height: '600px' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Code className="h-5 w-5 mr-2" />
          Embed Survey on Your Website
        </h3>
        <p className="text-gray-600 text-sm">
          Copy and paste any of the code snippets below to embed this survey on your website.
        </p>
      </div>

      {/* Direct Link */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Direct Embed URL</h4>
          <button
            onClick={() => copyToClipboard(embedUrl, 'url')}
            className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
          >
            <Copy className="h-3 w-3" />
            <span>{copiedType === 'url' ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <code className="block bg-white p-3 rounded border text-sm font-mono text-gray-800 overflow-x-auto">
          {embedUrl}
        </code>
        <p className="text-xs text-gray-500 mt-2">
          Use this URL directly in an iframe or for testing purposes.
        </p>
      </div>

      {/* Basic iframe */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Basic HTML iframe</h4>
          <button
            onClick={() => copyToClipboard(iframeCode, 'iframe')}
            className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
          >
            <Copy className="h-3 w-3" />
            <span>{copiedType === 'iframe' ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <code className="block bg-white p-3 rounded border text-sm font-mono text-gray-800 overflow-x-auto whitespace-pre">
          {iframeCode}
        </code>
        <p className="text-xs text-gray-500 mt-2">
          Simple iframe embed. You can adjust width and height as needed.
        </p>
      </div>

      {/* Responsive iframe */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Responsive iframe</h4>
          <button
            onClick={() => copyToClipboard(responsiveIframeCode, 'responsive')}
            className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
          >
            <Copy className="h-3 w-3" />
            <span>{copiedType === 'responsive' ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <code className="block bg-white p-3 rounded border text-sm font-mono text-gray-800 overflow-x-auto whitespace-pre">
          {responsiveIframeCode}
        </code>
        <p className="text-xs text-gray-500 mt-2">
          Responsive embed that maintains aspect ratio and works on all devices.
        </p>
      </div>

      {/* JavaScript embed */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">JavaScript embed</h4>
          <button
            onClick={() => copyToClipboard(javascriptCode, 'javascript')}
            className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
          >
            <Copy className="h-3 w-3" />
            <span>{copiedType === 'javascript' ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <code className="block bg-white p-3 rounded border text-sm font-mono text-gray-800 overflow-x-auto whitespace-pre">
          {javascriptCode}
        </code>
        <p className="text-xs text-gray-500 mt-2">
          Dynamic JavaScript embed that creates the iframe programmatically.
        </p>
      </div>

      {/* Live Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Live Preview
          </h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewSize('mobile')}
              className={`p-2 rounded ${previewSize === 'mobile' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
              title="Mobile"
            >
              <Smartphone className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewSize('tablet')}
              className={`p-2 rounded ${previewSize === 'tablet' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
              title="Tablet"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewSize('desktop')}
              className={`p-2 rounded ${previewSize === 'desktop' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
              title="Desktop"
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded border p-4 overflow-auto">
          <div 
            className="mx-auto transition-all duration-300"
            style={{ 
              width: getPreviewDimensions().width,
              maxWidth: '100%'
            }}
          >
            <iframe
              src={embedUrl}
              width="100%"
              height={getPreviewDimensions().height}
              frameBorder="0"
              scrolling="auto"
              title={`${surveyLink.survey.title} Preview`}
              className="border rounded"
            />
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Interactive preview of how your survey will appear when embedded. 
          Use the device buttons to test different screen sizes.
        </p>
      </div>

      {/* Integration Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Integration Notes</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Survey responses are collected and stored in your SurveyStack account</li>
          <li>• The embedded survey has no navigation bar and includes SurveyStack branding</li>
          <li>• All security settings (password protection, identification) are enforced</li>
          <li>• Survey will respect expiration dates and response limits</li>
          <li>• Mobile-responsive design works on all devices</li>
        </ul>
      </div>
    </div>
  );
};