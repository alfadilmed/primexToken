import { IPaletteItem } from '../types/editor'; // Adjusted path

export const paletteItems: IPaletteItem[] = [
  {
    id: 'text',
    name: 'Text Block',
    componentType: 'TextBlock',
    defaultProperties: { text: 'Some default text', color: '#000000', fontSize: 16 },
    propertyDefinitions: [
      { name: 'text', type: 'string', control: 'textArea', label: 'Text Content', defaultValue: 'Some default text' },
      { name: 'color', type: 'color', control: 'colorPicker', label: 'Text Color', defaultValue: '#000000' },
      { name: 'fontSize', type: 'number', control: 'numberInput', label: 'Font Size (px)', defaultValue: 16 },
    ],
  },
  {
    id: 'button',
    name: 'Button',
    componentType: 'ButtonComponent',
    defaultProperties: { label: 'Click Me', backgroundColor: '#3B82F6', textColor: '#FFFFFF' },
    propertyDefinitions: [
      { name: 'label', type: 'string', control: 'textInput', label: 'Button Label', defaultValue: 'Click Me' },
      { name: 'backgroundColor', type: 'color', control: 'colorPicker', label: 'Background Color', defaultValue: '#3B82F6' },
      { name: 'textColor', type: 'color', control: 'colorPicker', label: 'Text Color', defaultValue: '#FFFFFF' },
    ],
  },
  {
    id: 'connectWalletBtn',
    name: 'Connect Wallet Button',
    componentType: 'ConnectWalletButton',
    defaultProperties: { buttonText: 'Connect Wallet' },
    propertyDefinitions: [
      { name: 'buttonText', type: 'string', control: 'textInput', label: 'Button Text', defaultValue: 'Connect Wallet' },
    ],
  },
  {
    id: 'networkDisplay',
    name: 'Network Display',
    componentType: 'NetworkDisplay',
    defaultProperties: { prefixText: 'Current Network: ' },
    propertyDefinitions: [
      { name: 'prefixText', type: 'string', control: 'textInput', label: 'Prefix Text', defaultValue: 'Current Network: ' },
    ],
  },
  {
    id: 'balanceDisplay',
    name: 'Balance Display',
    componentType: 'BalanceDisplay',
    defaultProperties: { label: 'My Balance:', tokenAddress: '', displayDecimals: 4 },
    propertyDefinitions: [
      { name: 'label', type: 'string', control: 'textInput', label: 'Label', defaultValue: 'My Balance:' },
      { name: 'tokenAddress', type: 'string', control: 'textInput', label: 'Token Address (optional)', defaultValue: '' },
      { name: 'displayDecimals', type: 'number', control: 'numberInput', label: 'Display Decimals', defaultValue: 4 },
    ],
  },
];
