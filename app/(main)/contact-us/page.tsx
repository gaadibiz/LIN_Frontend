"use client";

import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, Building } from 'lucide-react';
import FootCTA from '@/components/FootCTA';
import Image from 'next/image';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export const dynamic = "force-dynamic";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    alert('Thank you for contacting us! We will get back to you soon.');
  };

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="min-h-screen w-full md:mt-12 mt-24">
      {/* Hero Section */}
      <div className='bg-gradient-to-r from-blue-50 to-cyan-50'>
        <div className="py-16 px-4 p-4 md:p-12 lg:p-20 max-w-7xl w-full mx-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex flex-col gap-4 w-full">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-red-500 font-medium">
                      Contact Us
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-3xl sm:text-5xl font-bold text-red-500 mb-4">Contact us</h1>
              <p className="text-gray-600">Have questions? Our team is just a message away.</p>
            </div>
            {/* <div className="hidden lg:block"> */}
            <Image src="/contact.png"
              alt="Contact Us"
              width={300}
              height={300}
              className="h-full object-contain w-[30%] sm:w-[42%]" />
            {/* </div> */}
          </div>
        </div>
      </div>

      {/* Contact Info and Form Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <p className="text-gray-600">customerservice@loaninneed.in</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <Phone className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Phone no.</h3>
                <p className="text-gray-600">+91 92663 28731</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <MessageCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                <a href="https://api.whatsapp.com/send/?phone=919217364584&text=Hi%20I%20have%20applied%20for%20a%20loan.%20I%20have%20a%20query.%20Please%20assist&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-green-600 transition-colors">
                  +91 92663 28731
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <Building className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Office address</h3>
                <p className="text-gray-600">
                  OFFICE NO-202, PLOT 9, Veer<br />
                  Savarkar Block, Guru Nanak<br />
                  Nagar, Shakarpur, Delhi, 110092
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h2>


            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Name *"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Mobile *"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <textarea
                  placeholder="Message *"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                ></textarea>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="w-full h-64 bg-gray-200 rounded-2xl overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.5276187803194!2d77.2927048!3d28.6436982!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfb8b3b3b3b3b%3A0x3b3b3b3b3b3b3b3b!2sShakarpur%2C%20Delhi!5e0!3m2!1sen!2sin!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>

      {/* CTA Section */}
      <FootCTA />
    </div>
  );
}