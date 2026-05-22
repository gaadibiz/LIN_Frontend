"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { photoAndLocationSchema, type PhotoLocationForm } from "@/lib/signup-schemas"
import { FileUpload } from "@/components/ui/file-upload"
import { MapPin, Loader2 } from "lucide-react"

interface Step6Props {
  onSubmit: (data: PhotoLocationForm) => void
  onBack?: () => void
  formData: PhotoLocationForm
  setFormData: (data: PhotoLocationForm) => void
}

export function Step6PhotoGPS({
  onSubmit,
  onBack,
  formData,
  setFormData
}: Step6Props) {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  
  const { handleSubmit, formState: { errors, isValid }, setValue, watch } = useForm<PhotoLocationForm>({
    mode: "onChange",
    resolver: zodResolver(photoAndLocationSchema),
    defaultValues: formData
  })

  const autoDetectLocation = watch("autoDetectLocation")
  const location = watch("location")

  const handleFormSubmit = (data: PhotoLocationForm) => {
    setFormData(data)
    onSubmit(data)
  }

  const handleFileChange = (file: File | null) => {
    if (file) {
      setValue("photoFile", file, { shouldValidate: true })
      setFormData({ ...formData, photoFile: file })
    }
  }

  const getLocation = () => {
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const locationString = `${latitude.toFixed(8)}, ${longitude.toFixed(8)}`
        
        setValue("location", locationString, { shouldValidate: true })
        setValue("autoDetectLocation", true, { shouldValidate: true })
        setFormData({ 
          ...formData, 
          autoDetectLocation: true, 
          location: locationString 
        })
        setIsLoadingLocation(false)
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location"
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions in your browser settings."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }
        
        setLocationError(errorMessage)
        setValue("autoDetectLocation", false, { shouldValidate: true })
        setFormData({ ...formData, autoDetectLocation: false, location: "" })
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleLocationToggle = (checked: boolean) => {
    if (checked) {
      getLocation()
    } else {
      setValue("autoDetectLocation", false, { shouldValidate: true })
      setValue("location", "", { shouldValidate: true })
      setFormData({ ...formData, autoDetectLocation: false, location: "" })
      setLocationError(null)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-red-600 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload your recent photo *
          </label>
          <FileUpload
            accept="image/*"
            placeholder="Click to upload or take photo"
            onFileChange={handleFileChange}
          />
          {errors.photoFile && (
            <p className="text-red-500 text-sm mt-1">{errors.photoFile.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoDetectLocation}
              onChange={(e) => handleLocationToggle(e.target.checked)}
              disabled={isLoadingLocation}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:opacity-50"
            />
            <span className="text-sm font-medium text-gray-700">
              Auto-detect location *
            </span>
          </label>
          
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              Please enable location permissions in your browser to auto-detect your current location
            </p>
          </div>

          {isLoadingLocation && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm">Detecting your location...</p>
            </div>
          )}

          {locationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{locationError}</p>
              <button
                type="button"
                onClick={getLocation}
                className="text-sm text-red-600 hover:text-red-700 font-medium mt-1 underline"
              >
                Try again
              </button>
            </div>
          )}

          {autoDetectLocation && location && !isLoadingLocation && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Location detected</p>
                  <p className="text-xs text-green-600 font-mono mt-1">{location}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-medium"
          disabled={isLoadingLocation || !isValid}
        >
          Submit application
        </Button>
      </div>
    </form>
  )
}
