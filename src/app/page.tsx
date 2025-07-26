"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

export default function Home() { 
  const [value,setValue] = useState("")
  const trpc = useTRPC()
  const invoke = useMutation(trpc.summarize.mutationOptions({
    onSuccess : ()=>{
      console.log("background task completed success!!")
    }
  }))

  return (
    <>
      <div className="p-4 max-w-7xl mx-auto">
        <Input value={value} onChange={(e)=>setValue(e.target.value)}></Input>
        <Button disabled={invoke.isPending} onClick={()=>invoke.mutate({value})}>Invoke Background Job</Button>
      </div>
    </>
  )
}
