import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from './models/Template'; // Adjust path as per your project structure

// Data adapted from frontend's editorConfig.ts
// This is a simplified representation. Actual templates might have more complex editorData or smartContractCode.
const sampleTemplatesData = [
  {
    name: 'Simple Landing Page',
    description: 'A basic landing page structure with a title, description, and a button.',
    category: 'Layout',
    // previewImage: '/path/to/simple-landing-preview.png',
    editorData: [
      { id: "static_id_title_1", type: "TextBlock", name: "Main Title", properties: { text: "Welcome from Template!", color: "#333333", fontSize: 32 } },
      { id: "static_id_desc_1", type: "TextBlock", name: "Description", properties: { text: "This content came from a template.", color: "#555555", fontSize: 18 } },
      { id: "static_id_cta_1", type: "ButtonComponent", name: "Call to Action", properties: { label: "Template Button", backgroundColor: "#3B82F6", textColor: "#FFFFFF" } }
    ],
    defaultConfig: { /* Default config for the template itself, if any, separate from editor content */ },
  },
  {
    name: 'Standard Button',
    description: 'A clickable button for user interactions.',
    category: 'Interaction',
    // previewImage: '/path/to/button-preview.png',
    editorData: {},
    defaultConfig: { label: 'Submit', backgroundColor: '#007BFF', textColor: '#FFFFFF' },
  },
  {
    name: 'Connect Wallet Feature',
    description: 'Adds a button to connect a Web3 wallet.',
    category: 'Web3',
    editorData: {},
    defaultConfig: { buttonText: 'Connect Your Wallet' },
  },
  {
    name: 'Display Network Info',
    description: 'Shows the currently connected blockchain network.',
    category: 'Web3',
    editorData: {},
    defaultConfig: { prefixText: 'You are on: ' },
  },
  {
    name: 'Show Account Balance',
    description: 'Displays the user\'s native token or a specified ERC20 token balance.',
    category: 'Web3',
    editorData: {},
    defaultConfig: { label: 'Current Balance: ', tokenAddress: '', displayDecimals: 2 },
  }
];

dotenv.config({ path: './.env' }); // Assuming .env is in the backend directory root

const seedDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not defined in .env file');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for seeding...');

    // Optional: Clear existing templates
    // await Template.deleteMany({}); 
    // console.log('Cleared existing templates.');

    for (const templateData of sampleTemplatesData) {
      const existingTemplate = await Template.findOne({ name: templateData.name });
      if (!existingTemplate) {
        await Template.create(templateData);
        console.log(`Added template: ${templateData.name}`);
      } else {
        console.log(`Template already exists: ${templateData.name}`);
      }
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedDB();
