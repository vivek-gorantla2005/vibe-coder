"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

export default function Home() {
  const [value, setValue] = useState("");
  const trpc = useTRPC();

  const invoke = useMutation(
    trpc.codeAgent.mutationOptions({
      onSuccess: () => {
        console.log("Background task completed successfully!");
      },
      onError: (err) => {
        console.error("Error invoking code agent:", err);
      },
    })
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter a code generation prompt"
      />
      <Button
        disabled={invoke.isPending}
        onClick={() => {
          if (!value.trim()) {
            console.warn("No input value provided");
            return;
          }
          invoke.mutate({ value });
        }}
        className="mt-2"
      >
        {invoke.isPending ? "Invoking..." : "Invoke Background Job"}
      </Button>
    </div>
  );
}
