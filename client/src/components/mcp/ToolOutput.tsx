import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileIcon, Mail, Video, Folder, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";

interface ToolOutputProps {
  toolName: string;
  data: any;
}

export function ToolOutput({ toolName, data }: ToolOutputProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return null;
  
  // Handle error responses (could be string or object with code/message)
  if (data.error) {
    const errorMessage = typeof data.error === 'string' 
      ? data.error 
      : data.error.message || JSON.stringify(data.error);
    return <div className="text-red-500 font-mono text-sm p-2 bg-red-50 rounded">Error: {errorMessage}</div>;
  }
  
  // Handle error with code and message at root level
  if (data.code && data.message) {
    return <div className="text-red-500 font-mono text-sm p-2 bg-red-50 rounded">Error ({data.code}): {data.message}</div>;
  }

  // Handle Confirmation Requests
  if (data.status === "confirmation_required" || data.pending_approval) {
     return (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Confirmation Needed
            </h4>
            <p className="text-amber-700 mb-3 text-sm">{data.message}</p>
            {data.details && (
              <div className="bg-white border border-amber-100 rounded-lg p-3 mb-3">
                <div className="text-xs text-gray-600 space-y-1">
                  {Object.entries(data.details).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-medium text-gray-500 w-24">{key}:</span>
                      <span className="text-gray-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-amber-600">Reply "yes" or "confirm" to proceed.</p>
        </div>
     );
  }

  // Handle success messages with collapsible details
  if (data.success === true && data.message) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
        <div className="p-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium text-sm">{data.message}</span>
        </div>
        {(data.event || data.meeting || data.result) && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-3 py-2 bg-green-100/50 border-t border-green-200 flex items-center gap-2 text-xs text-green-700 hover:bg-green-100 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {isExpanded ? "Hide details" : "Show details"}
            </button>
            {isExpanded && (
              <div className="p-3 bg-slate-900 border-t border-green-200">
                <pre className="text-xs text-slate-50 font-mono whitespace-pre-wrap">
                  {JSON.stringify(data.event || data.meeting || data.result || data, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // --- Specialized Renderers ---

  if (toolName === "list_unread_emails_today" && Array.isArray(data)) {
    return (
      <div className="border rounded-md overflow-hidden my-2">
        <Table>
            <TableHeader className="bg-gray-50">
                <TableRow>
                    <TableHead>Sender</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-[100px]">Time</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((email: any, i: number) => (
                    <TableRow key={i}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500"/> {email.sender || email.from}
                        </TableCell>
                        <TableCell>{email.subject}</TableCell>
                        <TableCell className="text-xs text-gray-500">{new Date(email.timestamp || email.receivedAt).toLocaleTimeString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    );
  }

  if (toolName.includes("drive") && Array.isArray(data)) {
      return (
        <div className="grid grid-cols-1 gap-2 my-2">
            {data.map((file: any, i: number) => (
                <div key={i} className="flex items-center p-2 border rounded hover:bg-gray-50 bg-white">
                    {file.type === 'folder' ? <Folder className="w-5 h-5 text-blue-500 mr-3"/> : <FileIcon className="w-5 h-5 text-gray-500 mr-3"/>}
                    <div className="flex-1">
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-gray-400">{file.type} • {new Date(file.lastModified).toLocaleDateString()}</div>
                    </div>
                </div>
            ))}
        </div>
      )
  }

  if (toolName.includes("zoom")) {
       if (Array.isArray(data)) {
           return (
               <div className="my-2 space-y-2">
                   {data.map((meeting: any, i:number) => (
                       <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-white border-blue-100">
                           <div className="flex items-center gap-3">
                               <div className="bg-blue-100 p-2 rounded-full"><Video className="w-5 h-5 text-blue-600"/></div>
                               <div>
                                   <div className="font-semibold text-sm">{meeting.topic}</div>
                                   <div className="text-xs text-gray-500">{new Date(meeting.start_time).toLocaleString()} ({meeting.duration} min)</div>
                               </div>
                           </div>
                           <Badge variant="outline">{meeting.id}</Badge>
                       </div>
                   ))}
               </div>
           );
       } else if (data.status === "success" && data.meeting) {
           // Created/Updated
           const m = data.meeting;
            return (
               <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-900 my-2">
                   <div className="flex items-center gap-2 mb-2">
                       <Video className="w-5 h-5"/>
                       <span className="font-bold">Meeting Scheduled!</span>
                   </div>
                   <div className="space-y-1 text-sm">
                       <div><span className="font-semibold">Topic:</span> {m.topic}</div>
                       <div><span className="font-semibold">Time:</span> {new Date(m.start_time).toLocaleString()}</div>
                       <div><span className="font-semibold">Join:</span> <a href={m.join_url} target="_blank" className="underline text-blue-600">Link</a></div>
                   </div>
               </div>
           )
       }
  }

  // Fallback: Collapsible JSON View
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 bg-gray-100 flex items-center gap-2 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {isExpanded ? "Hide response" : "Show response"}
      </button>
      {isExpanded && (
        <ScrollArea className="max-h-[300px] w-full p-4 bg-slate-900">
          <pre className="text-xs text-slate-50 font-mono whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </ScrollArea>
      )}
    </div>
  );
}
