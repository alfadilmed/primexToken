import React from 'react';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface ApiTemplate {
  _id: string;
  name: string;
  description: string;
  category: string;
  previewImage?: string;
  editorData: any; // Consider refining this type later e.g. ICanvasComponent[]
  // any other fields that come from the backend
}

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<ApiTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // Get navigate function

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get<ApiTemplate[]>('/api/templates');
        setTemplates(response.data);
      } catch (err) {
        setError('Failed to fetch templates. Please try again later.');
        console.error('Error fetching templates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []); // Empty dependency array means this effect runs once on mount

  if (isLoading) {
    return <div className="p-8 text-center">Loading templates...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center">Choose a Template</h1>
      {templates.length === 0 ? (
        <p className="text-center text-gray-500">No templates available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <div key={template._id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
              <img 
                src={template.previewImage || `https://via.placeholder.com/300x180.png?text=${encodeURIComponent(template.name)}`} 
                alt={`${template.name} preview`} 
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex flex-col flex-grow">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{template.name}</h2>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{template.description || 'No description available.'}</p>
                <p className="text-xs text-gray-400 mb-3">Category: {template.category || 'General'}</p>
                <button
                  onClick={() => {
                    // Ensure template.editorData is what you expect.
                    // If it's an empty object from seed, this won't populate the canvas meaningfully.
                    console.log('Using template:', template.name, 'with editorData:', template.editorData);
                    navigate('/editor', { state: { templateEditorData: template.editorData } });
                  }}
                  className="mt-auto w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition ease-in-out duration-150"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Templates;
