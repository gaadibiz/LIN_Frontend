"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { motion } from "framer-motion";

const partnerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    mobile: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number."),
    email: z.string().email("Enter a valid email address."),
    message: z.string().min(5, "Message must be at least 5 characters."),
    agree: z.literal(true, "You must agree to the terms."),
});

export default function PartnerForm() {
    const [submitted, setSubmitted] = React.useState(false);
    const [focusedFields, setFocusedFields] = React.useState<{ [key: string]: boolean }>({});

    const setFieldFocused = (fieldName: string, isFocused: boolean) => {
        setFocusedFields((prev) => ({ ...prev, [fieldName]: isFocused }));
    };


    const form = useForm({
        defaultValues: {
            name: "",
            mobile: "",
            email: "",
            message: "",
            agree: false,
        },
        validators: {
            onSubmit: ({ value }) => {
                const result = partnerSchema.safeParse(value);
                if (!result.success) {
                    return result.error.flatten().fieldErrors;
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            console.log("Form Submitted:", value);
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 2000);
        },
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
            }}
            className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-5"
        >
            {/* Name Field */}
            <form.Field name="name">
                {(field) => {
                    const isFocused = focusedFields[field.name] ?? false;
                    const isActive = isFocused || field.state.value.length > 0;

                    return (
                        <div className="relative">
                            {/* Floating label */}
                            <motion.label
                                htmlFor={field.name}
                                initial={false}
                                animate={{
                                    y: isActive ? -20 : 0,
                                    scale: isActive ? 0.9 : 1,
                                    color: isActive ? "#ef4444" : "#6b7280",
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="absolute left-3 top-3 pointer-events-none px-1 bg-white z-[1]"
                            >
                                Name *
                            </motion.label>

                            <Input
                                id={field.name}
                                value={field.state.value}
                                onFocus={() => setFieldFocused(field.name, true)}
                                onBlur={(e) => {
                                    setFieldFocused(field.name, false);
                                    field.handleBlur();
                                }}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="h-14 text-base border-gray-300 focus:border-red-500 focus:ring-red-500 pt-6 placeholder-transparent"
                            />

                            {field.state.meta.errors?.[0] && (
                                <p className="text-xs text-red-500 mt-1">{field.state.meta.errors[0]}</p>
                            )}
                        </div>
                    );
                }}
            </form.Field>


            {/* Mobile Field */}
            <form.Field name="mobile">
                {(field) => {
                    const isFocused = focusedFields[field.name] ?? false;
                    const isActive = isFocused || field.state.value.length > 0;

                    return (
                        <div className="relative">
                            <motion.label
                                htmlFor={field.name}
                                initial={false}
                                animate={{
                                    y: isActive ? -20 : 0,
                                    scale: isActive ? 0.9 : 1,
                                    color: isActive ? "#ef4444" : "#6b7280",
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="absolute left-3 top-3 pointer-events-none px-1 bg-white z-[1]"
                            >
                                Mobile *
                            </motion.label>
                            <Input
                                id={field.name}
                                value={field.state.value}
                                type="tel"
                                onFocus={() => setFieldFocused(field.name, true)}
                                onBlur={(e) => {
                                    setFieldFocused(field.name, false);
                                    field.handleBlur();
                                }}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="h-14 text-base border-gray-300 focus:border-red-500 focus:ring-red-500 pt-6 placeholder-transparent"
                            />
                            {field.state.meta.errors?.[0] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {field.state.meta.errors[0]}
                                </p>
                            )}
                        </div>
                    );
                }}
            </form.Field>

            {/* Email Field */}
            <form.Field name="email">
                {(field) => {
                    const isFocused = focusedFields[field.name] ?? false;
                    const isActive = isFocused || field.state.value.length > 0;

                    return (
                        <div className="relative">
                            <motion.label
                                htmlFor={field.name}
                                initial={false}
                                animate={{
                                    y: isActive ? -20 : 0,
                                    scale: isActive ? 0.9 : 1,
                                    color: isActive ? "#ef4444" : "#6b7280",
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="absolute left-3 top-3 pointer-events-none px-1 bg-white z-[1]"
                            >
                                Email *
                            </motion.label>
                            <Input
                                id={field.name}
                                value={field.state.value}
                                onFocus={() => setFieldFocused(field.name, true)}
                                onBlur={(e) => {
                                    setFieldFocused(field.name, false);
                                    field.handleBlur();
                                }}
                                onChange={(e) => field.handleChange(e.target.value)}
                                type="email"
                                className="h-14 text-base border-gray-300 focus:border-red-500 focus:ring-red-500 placeholder:text-gray-500"
                            />
                            {field.state.meta.errors?.[0] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {field.state.meta.errors[0]}
                                </p>
                            )}
                        </div>
                    );
                }}
            </form.Field>

            {/* Message Field */}
            <form.Field name="message">
                {(field) => {
                    const isFocused = focusedFields[field.name] ?? false;
                    const isActive = isFocused || field.state.value.length > 0;

                    return (
                        <div className="relative">
                            <motion.label
                                htmlFor={field.name}
                                initial={false}
                                animate={{
                                    y: isActive ? -20 : 0,
                                    scale: isActive ? 0.9 : 1,
                                    color: isActive ? "#ef4444" : "#6b7280",
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="absolute left-3 top-3 pointer-events-none px-1 bg-white z-[1]"
                            >
                                Message *
                            </motion.label>
                            <Textarea
                                id={field.name}
                                value={field.state.value}
                                onFocus={() => setFieldFocused(field.name, true)}
                                onBlur={(e) => {
                                    setFieldFocused(field.name, false);
                                    field.handleBlur();
                                }}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="min-h-[120px] text-base border-gray-300 focus:border-red-500 focus:ring-red-500 placeholder:text-gray-500 resize-none"
                            />
                            {field.state.meta.errors?.[0] && (
                                <p className="text-xs text-red-500 mt-1">
                                    {field.state.meta.errors[0]}
                                </p>
                            )}
                        </div>
                    );
                }}
            </form.Field>

            {/* Agree Checkbox */}
            <form.Field name="agree">
                {(field) => (
                    <div className="space-y-1">
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id={field.name}
                                checked={field.state.value}
                                onCheckedChange={(val) => field.handleChange(!!val)}
                                className="mt-0.5 border-gray-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 cursor-pointer"
                            />
                            <label
                                htmlFor={field.name}
                                className="text-sm text-gray-600 leading-relaxed cursor-pointer"
                            >
                                By continuing, you agree to our{" "}
                                <Link
                                    href="/privacy"
                                    className="text-red-500 underline hover:text-red-600"
                                >
                                    privacy policies
                                </Link>{" "}
                                and{" "}
                                <Link
                                    href="/terms"
                                    className="text-red-500 underline hover:text-red-600"
                                >
                                    T&C
                                </Link>
                                .
                            </label>
                        </div>
                        {field.state.meta.errors?.[0] && (
                            <p className="text-xs text-red-500 ml-7">
                                {field.state.meta.errors[0]}
                            </p>
                        )}
                    </div>
                )}
            </form.Field>

            {/* Submit Button */}
            <form.Subscribe selector={(state) => [state.isSubmitting, state.values]}>
                {([isSubmitting, values]) => {
                    const isValid = partnerSchema.safeParse(values).success;
                    return (
                        <Button
                            type="submit"
                            disabled={isSubmitting || !isValid}
                            variant={"default"}
                            size={"lg"}
                            className="w-full hover:bg-red-600 text-base font-semibold tracking-wide uppercase disabled:opacity-50"
                        >
                            {submitted ? "Submitted!" : "CONNECT NOW"}
                        </Button>
                    );
                }}
            </form.Subscribe>
        </form>
    );
}
