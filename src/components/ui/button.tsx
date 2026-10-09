import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "button-primary",
        ghost: "button-ghost",
        outline: "button-outline",
      },
      size: {
        default: "min-h-11 px-5 py-3",
        sm: "min-h-10 px-3 py-2",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "ghost", size: "default" },
  },
);
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
