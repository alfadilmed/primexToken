import Template from '../models/Template'; // Adjust path as necessary
import { Request, Response } from 'express';
import logger from '../config/logger'; // Added logger import

export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await Template.find();
    res.status(200).json(templates);
  } catch (error: any) {
    logger.error('Error in getAllTemplates', { message: error.message, stack: error.stack });
    if (error instanceof Error) {
        res.status(500).json({ message: 'Error fetching templates', error: error.message });
    } else {
        res.status(500).json({ message: 'Error fetching templates', error: 'An unknown error occurred' });
    }
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const newTemplate = new Template(req.body);
    const savedTemplate = await newTemplate.save();
    res.status(201).json(savedTemplate);
  } catch (error: any) {
    logger.error('Error in createTemplate', { message: error.message, stack: error.stack, requestBody: req.body });
     if (error instanceof Error) {
        res.status(400).json({ message: 'Error creating template', error: error.message });
    } else {
        res.status(400).json({ message: 'Error creating template', error: 'An unknown error occurred' });
    }
  }
};
