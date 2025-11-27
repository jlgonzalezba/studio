"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useRef, ChangeEvent, useState, useEffect } from "react";
import * as THREE from 'three';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMultifingerCaliper } from "./layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// HTML5 Canvas Plot Component
const HTML5CanvasPlot = ({
  data,
  setCurrentDepth,
  useCustomScale,
  customMinDiam,
  customMaxDiam,
  showCollars
}: {
  data: any,
  setCurrentDepth: (depth: number | null) => void,
  useCustomScale: boolean,
  customMinDiam: number,
  customMaxDiam: number,
  showCollars: boolean
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomState, setZoomState] = useState({
    minDepth: null as number | null,
    maxDepth: null as number | null,
    minDiam: null as number | null,
    maxDiam: null as number | null
  });
  const [selection, setSelection] = useState<{start: {x: number, y: number} | null, end: {x: number, y: number} | null}>({start: null, end: null});
  const [isDragging, setIsDragging] = useState(false);
  const [thumbTop, setThumbTop] = useState(50);
  const [tooltip, setTooltip] = useState<{show: boolean, x: number, y: number, depth: number, min: number, max: number, avg: number, gr: number | null, temp: number | null} | null>(null);
  const [horizontalLineY, setHorizontalLineY] = useState<number | null>(null);
  const [showFingerReadings, setShowFingerReadings] = useState(false);

  useEffect(() => {
    if (!data || !data.plot_data) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { plot_data, raw_data } = data;

    // Clear canvas
    const canvasWidth = showFingerReadings ? 900 : 600;
    const canvasHeight = 600;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Get GR and Temp data
    const grCurves = raw_data.gr_curves || [];
    const tempCurves = raw_data.temp_curves || [];
    const grData = raw_data.gr_data || {};
    const tempData = raw_data.temp_data || {};
    const grKey = grCurves[0];
    const tempKey = tempCurves[0];
    const grValues = grKey ? grData[grKey] : null;
    const tempValues = tempKey ? tempData[tempKey] : null;

    // Reverse for plotting
    const plotGR = grValues ? [...grValues].reverse() : null;
    const plotTemp = tempValues ? [...tempValues].reverse() : null;

    // GR and Temp ranges
    const grMin = plotGR ? Math.min(...plotGR.filter(v => v !== null && v !== undefined)) : 0;
    const grMax = plotGR ? Math.max(...plotGR.filter(v => v !== null && v !== undefined)) : 200;
    const tempMin = plotTemp ? Math.min(...plotTemp.filter(v => v !== null && v !== undefined)) : 0;
    const tempMax = plotTemp ? Math.max(...plotTemp.filter(v => v !== null && v !== undefined)) : 300;

    // Get data ranges
    const depthMin = plot_data.depth.reduce((min, val) => Math.min(min, val), Infinity);
    const depthMax = plot_data.depth.reduce((max, val) => Math.max(max, val), -Infinity);
    const allDiameters = [...plot_data.min_diameter, ...plot_data.max_diameter, ...plot_data.avg_diameter];
    const diamMin = allDiameters.reduce((min, val) => Math.min(min, val), Infinity);
    const diamMax = allDiameters.reduce((max, val) => Math.max(max, val), -Infinity);

    // Visible ranges for zoom
    const visibleDepthMin = zoomState.minDepth ?? depthMin;
    const visibleDepthMax = zoomState.maxDepth ?? depthMax;
    const visibleDiamMin = useCustomScale ? customMinDiam : (zoomState.minDiam ?? diamMin);
    const visibleDiamMax = useCustomScale ? customMaxDiam : (zoomState.maxDiam ?? diamMax);

    // Function to draw line
    const drawLine = (points: number[][], color: string) => {
      if (points.length === 0) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
    };

    // Filter indices for visible depth range
    const visibleIndices = plot_data.depth.map((d, i) => ({ d, i })).filter(item => item.d >= visibleDepthMin && item.d <= visibleDepthMax);

    // Create lines only for visible points
    const minPoints = visibleIndices.map(({ i }) => [
      Math.max(10, Math.min(390, ((plot_data.min_diameter[i] - visibleDiamMin) / (visibleDiamMax - visibleDiamMin)) * 380 + 10)),
      15 + ((plot_data.depth[i] - visibleDepthMin) / (visibleDepthMax - visibleDepthMin)) * 535
    ]);
    const maxPoints = visibleIndices.map(({ i }) => [
      Math.max(10, Math.min(390, ((plot_data.max_diameter[i] - visibleDiamMin) / (visibleDiamMax - visibleDiamMin)) * 380 + 10)),
      15 + ((plot_data.depth[i] - visibleDepthMin) / (visibleDepthMax - visibleDepthMin)) * 535
    ]);
    const avgPoints = visibleIndices.map(({ i }) => [
      Math.max(10, Math.min(390, ((plot_data.avg_diameter[i] - visibleDiamMin) / (visibleDiamMax - visibleDiamMin)) * 380 + 10)),
      15 + ((plot_data.depth[i] - visibleDepthMin) / (visibleDepthMax - visibleDepthMin)) * 535
    ]);

    drawLine(minPoints, '#0066ff');
    drawLine(maxPoints, '#cc0000');
    drawLine(avgPoints, '#66ffff');

    // Draw GR
    if (plotGR) {
      const grPoints: number[][] = [];
      visibleIndices.forEach(({ i }) => {
        const val = plotGR[i];
        if (val !== null && plot_data.depth[i] !== undefined) {
          const x = 410 + ((val - grMin) / (grMax - grMin)) * 80;
          const y = 15 + ((plot_data.depth[i] - visibleDepthMin) / (visibleDepthMax - visibleDepthMin)) * 535;
          grPoints.push([x, y]);
        }
      });
      drawLine(grPoints, 'green');
    }

    // Draw Temp
    if (plotTemp) {
      const tempPoints: number[][] = [];
      visibleIndices.forEach(({ i }) => {
        const val = plotTemp[i];
        if (val !== null && plot_data.depth[i] !== undefined) {
          const x = 510 + ((val - tempMin) / (tempMax - tempMin)) * 80;
          const y = 15 + ((plot_data.depth[i] - visibleDepthMin) / (visibleDepthMax - visibleDepthMin)) * 535;
          tempPoints.push([x, y]);
        }
      });
      drawLine(tempPoints, 'red');
    }

    // Draw axes
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    // X axis
    ctx.beginPath();
    ctx.moveTo(10, 575);
    ctx.lineTo(390, 575);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(10, 15);
    ctx.lineTo(10, 550);
    ctx.stroke();

    // Y axis ticks
    for (let i = 0; i <= 10; i++) {
      const y = 15 + (i / 10) * 535;
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(5, y);
      ctx.stroke();
    }

    // X axis ticks
    for (let i = 0; i <= 5; i++) {
      const x = 10 + (i / 5) * 380;
      ctx.beginPath();
      ctx.moveTo(x, 575);
      ctx.lineTo(x, 580);
      ctx.stroke();
    }

    // GR X axis
    ctx.beginPath();
    ctx.moveTo(410, 575);
    ctx.lineTo(490, 575);
    ctx.stroke();

    // GR X axis ticks (only min and max)
    for (let i of [0, 5]) {
      const x = 410 + (i / 5) * 80;
      ctx.beginPath();
      ctx.moveTo(x, 575);
      ctx.lineTo(x, 580);
      ctx.stroke();
    }

    // Temp X axis
    ctx.beginPath();
    ctx.moveTo(510, 575);
    ctx.lineTo(590, 575);
    ctx.stroke();

    // Temp X axis ticks (only min and max)
    for (let i of [0, 5]) {
      const x = 510 + (i / 5) * 80;
      ctx.beginPath();
      ctx.moveTo(x, 575);
      ctx.lineTo(x, 580);
      ctx.stroke();
    }

    // Vertical divider line between caliper and GR/Temp
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);
    ctx.stroke();

    // Draw finger readings track if enabled
    if (showFingerReadings && raw_data.r_curves && raw_data.r_curves.length > 0) {
      const fingerTrackX = 620;
      const fingerTrackWidth = 260;

      // Draw finger readings axes
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;

      // Y axis for finger readings (same as main plot)
      ctx.beginPath();
      ctx.moveTo(fingerTrackX, 15);
      ctx.lineTo(fingerTrackX, 550);
      ctx.stroke();

      // X axis for finger readings
      ctx.beginPath();
      ctx.moveTo(fingerTrackX, 575);
      ctx.lineTo(fingerTrackX + fingerTrackWidth, 575);
      ctx.stroke();

      // Y axis ticks for finger readings
      for (let i = 0; i <= 10; i++) {
        const y = 15 + (i / 10) * 535;
        ctx.beginPath();
        ctx.moveTo(fingerTrackX, y);
        ctx.lineTo(fingerTrackX - 5, y);
        ctx.stroke();
      }

      // X axis ticks for finger readings (finger numbers)
      const numFingers = raw_data.r_curves[0]?.length || 0;
      for (let i = 0; i <= numFingers; i += Math.max(1, Math.floor(numFingers / 5))) {
        const x = fingerTrackX + (i / numFingers) * fingerTrackWidth;
        ctx.beginPath();
        ctx.moveTo(x, 575);
        ctx.lineTo(x, 580);
        ctx.stroke();
      }

      // Draw individual finger readings
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#800000'];
      const reversedDepth = [...plot_data.depth].reverse();
      const reversedRCurves = [...raw_data.r_curves].reverse();

      // Filter visible indices for finger readings (using reversed arrays)
      const visibleFingerIndices = reversedDepth.map((d, i) => ({ d, i })).filter(item => item.d >= visibleDepthMin && item.d <= visibleDepthMax);

      for (let fingerIdx = 0; fingerIdx < numFingers; fingerIdx++) {
        const color = colors[fingerIdx % colors.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();

        let hasValidPoints = false;
        visibleFingerIndices.forEach(({ i }) => {
          const depth = reversedDepth[i];
          const rValues = reversedRCurves[i];
          if (rValues && rValues[fingerIdx] !== null && rValues[fingerIdx] !== undefined) {
            const value = rValues[fingerIdx];
            const x = fingerTrackX + (fingerIdx / numFingers) * fingerTrackWidth;
            const y = 15 + ((depth - visibleDepthMin) / (visibleDepthMax - visibleDepthMin)) * 535;

            if (!hasValidPoints) {
              ctx.moveTo(x, y);
              hasValidPoints = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        });
        if (hasValidPoints) {
          ctx.stroke();
        }
      }

      // Vertical divider line between temp and finger readings
      ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(610, 0);
      ctx.lineTo(610, 600);
      ctx.stroke();
    }

    // Selection rectangle
    if (selection.start && selection.end) {
      const startY = Math.min(selection.start.y, selection.end.y);
      const endY = Math.max(selection.start.y, selection.end.y);

      ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
      ctx.fillRect(10, startY, 580, endY - startY);
    }

    // Add HTML labels
    if (mountRef.current) {
      // Clear previous labels
      const labels = mountRef.current.querySelectorAll('.plot-label');
      labels.forEach(label => label.remove());

      // Y axis labels (depth)
      for (let i = 0; i <= 10; i++) {
        const depthValue = visibleDepthMin + (i / 10) * (visibleDepthMax - visibleDepthMin);
        const label = document.createElement('div');
        label.className = 'plot-label';
        label.textContent = depthValue.toFixed(0);
        label.style.position = 'absolute';
        label.style.left = '-40px';
        label.style.width = '35px';
        label.style.textAlign = 'right';
        const y = 15 + (i / 10) * 535;
        const topPosition = y;
        label.style.top = `${topPosition}px`;
        label.style.transform = 'translateY(-50%)';
        label.style.fontSize = '10px';
        label.style.color = 'black';
        label.style.pointerEvents = 'none';
        mountRef.current.appendChild(label);
      }

      // X axis labels (diameter) - use custom scale if enabled
      const displayMinDiam = useCustomScale ? customMinDiam : diamMin;
      const displayMaxDiam = useCustomScale ? customMaxDiam : diamMax;
      for (let i = 0; i <= 5; i++) {
        const diamValue = displayMinDiam + (i / 5) * (displayMaxDiam - displayMinDiam);
        const label = document.createElement('div');
        label.className = 'plot-label';
        label.textContent = diamValue.toFixed(2) + '"';
        label.style.position = 'absolute';
        label.style.bottom = '5px';
        const leftPosition = 10 + (i / 5) * 380;
        label.style.left = `${leftPosition}px`;
        label.style.transform = 'translateX(-50%)';
        label.style.fontSize = '10px';
        label.style.color = 'black';
        label.style.pointerEvents = 'none';
        mountRef.current.appendChild(label);
      }

      // GR X axis labels (only min and max)
      for (let i of [0, 5]) {
        const grValue = grMin + (i / 5) * (grMax - grMin);
        const label = document.createElement('div');
        label.className = 'plot-label';
        label.textContent = Math.round(grValue).toString();
        label.style.position = 'absolute';
        label.style.bottom = '5px';
        const leftPosition = 410 + (i / 5) * 80;
        label.style.left = `${leftPosition}px`;
        label.style.transform = 'translateX(-50%)';
        label.style.fontSize = '10px';
        label.style.color = 'black';
        label.style.pointerEvents = 'none';
        mountRef.current.appendChild(label);
      }

      // Temp X axis labels (only min and max)
      for (let i of [0, 5]) {
        const tempValue = tempMin + (i / 5) * (tempMax - tempMin);
        const label = document.createElement('div');
        label.className = 'plot-label';
        label.textContent = Math.round(tempValue).toString();
        label.style.position = 'absolute';
        label.style.bottom = '5px';
        const leftPosition = 510 + (i / 5) * 80;
        label.style.left = `${leftPosition}px`;
        label.style.transform = 'translateX(-50%)';
        label.style.fontSize = '10px';
        label.style.color = 'black';
        label.style.pointerEvents = 'none';
        mountRef.current.appendChild(label);
      }

      // Finger readings axis labels if enabled
      if (showFingerReadings && raw_data.r_curves && raw_data.r_curves.length > 0) {
        const numFingers = raw_data.r_curves[0]?.length || 0;

        // Finger readings title
        const fingerTitle = document.createElement('div');
        fingerTitle.className = 'plot-label';
        fingerTitle.textContent = 'Finger Readings (R01-R' + numFingers.toString().padStart(2, '0') + ')';
        fingerTitle.style.position = 'absolute';
        fingerTitle.style.bottom = '-35px';
        fingerTitle.style.left = '745px';
        fingerTitle.style.transform = 'translateX(-50%)';
        fingerTitle.style.fontSize = '12px';
        fingerTitle.style.color = 'black';
        fingerTitle.style.pointerEvents = 'none';
        mountRef.current.appendChild(fingerTitle);

        // Finger number labels
        for (let i = 0; i <= numFingers; i += Math.max(1, Math.floor(numFingers / 5))) {
          const fingerNum = i + 1;
          const label = document.createElement('div');
          label.className = 'plot-label';
          label.textContent = 'R' + fingerNum.toString().padStart(2, '0');
          label.style.position = 'absolute';
          label.style.bottom = '5px';
          const leftPosition = 620 + (i / numFingers) * 260;
          label.style.left = `${leftPosition}px`;
          label.style.transform = 'translateX(-50%)';
          label.style.fontSize = '8px';
          label.style.color = 'black';
          label.style.pointerEvents = 'none';
          mountRef.current.appendChild(label);
        }
      }

      // Axis titles
      const xTitle = document.createElement('div');
      xTitle.className = 'plot-label';
      xTitle.textContent = 'Diameter (inches)';
      xTitle.style.position = 'absolute';
      xTitle.style.bottom = '-35px';
      xTitle.style.left = '50%';
      xTitle.style.transform = 'translateX(-50%)';
      xTitle.style.fontSize = '12px';
      xTitle.style.color = 'black';
      xTitle.style.pointerEvents = 'none';
      mountRef.current.appendChild(xTitle);

      const grTitle = document.createElement('div');
      grTitle.className = 'plot-label';
      grTitle.textContent = 'GR (API)';
      grTitle.style.position = 'absolute';
      grTitle.style.bottom = '-35px';
      grTitle.style.left = '450px';
      grTitle.style.transform = 'translateX(-50%)';
      grTitle.style.fontSize = '12px';
      grTitle.style.color = 'black';
      grTitle.style.pointerEvents = 'none';
      mountRef.current.appendChild(grTitle);

      const tempTitle = document.createElement('div');
      tempTitle.className = 'plot-label';
      tempTitle.textContent = 'Temp (°F)';
      tempTitle.style.position = 'absolute';
      tempTitle.style.bottom = '-35px';
      tempTitle.style.left = '550px';
      tempTitle.style.transform = 'translateX(-50%)';
      tempTitle.style.fontSize = '12px';
      tempTitle.style.color = 'black';
      tempTitle.style.pointerEvents = 'none';
      mountRef.current.appendChild(tempTitle);

      const yTitle = document.createElement('div');
      yTitle.className = 'plot-label';
      yTitle.textContent = 'Depth (feet)';
      yTitle.style.position = 'absolute';
      yTitle.style.top = '50%';
      yTitle.style.left = '-65px';
      yTitle.style.transform = 'rotate(-90deg) translateY(-50%)';
      yTitle.style.transformOrigin = 'left center';
      yTitle.style.fontSize = '12px';
      yTitle.style.color = 'black';
      yTitle.style.pointerEvents = 'none';
      mountRef.current.appendChild(yTitle);
    }

    // Draw horizontal tracking line
    if (horizontalLineY !== null) {
      ctx.strokeStyle = 'gray';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, horizontalLineY);
      ctx.lineTo(showFingerReadings ? 900 : 600, horizontalLineY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw collars lines if enabled
    if (showCollars && data.collars_data && data.collars_data.length > 0) {
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      data.collars_data.forEach((collar: number[]) => {
        if (collar && collar.length >= 2) {
          const depth1 = collar[0];
          const depth2 = collar[1];

          // Helper function to check if a value is valid (not NaN, null, undefined, or infinite)
          const isValidDepth = (depth: any): boolean => {
            return depth !== null &&
                   depth !== undefined &&
                   !isNaN(depth) &&
                   isFinite(depth) &&
                   typeof depth === 'number';
          };

          // Draw line for first depth (red) if valid
          if (isValidDepth(depth1)) {
            ctx.strokeStyle = 'red';
            const y1 = 15 + ((depth1 - visibleDepthMin) / (visibleDepthMax - visibleDepthMin)) * 535;
            if (y1 >= 15 && y1 <= 550) {
              ctx.beginPath();
              ctx.moveTo(10, y1);
              ctx.lineTo(showFingerReadings ? 880 : 580, y1);
              ctx.stroke();
            }
          }

          // Draw line for second depth (blue) if valid
          if (isValidDepth(depth2)) {
            ctx.strokeStyle = 'blue';
            const y2 = 15 + ((depth2 - visibleDepthMin) / (visibleDepthMax - visibleDepthMin)) * 535;
            if (y2 >= 15 && y2 <= 550) {
              ctx.beginPath();
              ctx.moveTo(10, y2);
              ctx.lineTo(showFingerReadings ? 880 : 580, y2);
              ctx.stroke();
            }
          }
        }
      });
    }

  }, [data, zoomState, selection, horizontalLineY, showFingerReadings, showCollars]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setSelection({start: {x, y}, end: {x, y}});
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setHorizontalLineY(y);

    if (selection.start) {
      setSelection(prev => prev.start ? {start: prev.start, end: {x, y}} : prev);
      setTooltip(null);
    } else if (data && data.plot_data) {
      const visibleDepthMin = zoomState.minDepth ?? Math.min(...data.plot_data.depth);
      const visibleDepthMax = zoomState.maxDepth ?? Math.max(...data.plot_data.depth);
      const depth = visibleDepthMin + ((y - 15) / 535) * (visibleDepthMax - visibleDepthMin);

      const visibleIndices = data.plot_data.depth.map((d: number, i: number) => ({d, i})).filter((item: {d: number, i: number}) => item.d >= visibleDepthMin && item.d <= visibleDepthMax);
      if (visibleIndices.length === 0) return;

      let closest = visibleIndices[0];
      let minDiff = Math.abs(closest.d - depth);
      for (let i = 1; i < visibleIndices.length; i++) {
        const diff = Math.abs(visibleIndices[i].d - depth);
        if (diff < minDiff) {
          minDiff = diff;
          closest = visibleIndices[i];
        }
      }

      const minVal = data.plot_data.min_diameter[closest.i];
      const maxVal = data.plot_data.max_diameter[closest.i];
      const avgVal = data.plot_data.avg_diameter[closest.i];

      const grCurves = data.raw_data.gr_curves || [];
      const tempCurves = data.raw_data.temp_curves || [];
      const grData = data.raw_data.gr_data || {};
      const tempData = data.raw_data.temp_data || {};
      const grKey = grCurves[0];
      const tempKey = tempCurves[0];
      const grVal = grKey && grData[grKey] ? grData[grKey][closest.i] : null;
      const tempVal = tempKey && tempData[tempKey] ? tempData[tempKey][closest.i] : null;

      setTooltip({show: true, x, y, depth: closest.d, min: minVal, max: maxVal, avg: avgVal, gr: grVal, temp: tempVal});
      setCurrentDepth(closest.d);
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selection.start || !selection.end) return;
    const startY = Math.min(selection.start.y, selection.end.y);
    const endY = Math.max(selection.start.y, selection.end.y);

    if (!data || !data.plot_data) return;
    const { plot_data } = data;
    const depthMin = Math.min(...plot_data.depth);
    const depthMax = Math.max(...plot_data.depth);
    const visibleDepthMin = zoomState.minDepth ?? depthMin;
    const visibleDepthMax = zoomState.maxDepth ?? depthMax;

    if (Math.abs(endY - startY) > 10) {
      const depthMinSel = visibleDepthMin + ((startY - 15) / 535) * (visibleDepthMax - visibleDepthMin);
      const depthMaxSel = visibleDepthMin + ((endY - 15) / 535) * (visibleDepthMax - visibleDepthMin);

      // Calculate new thumb position based on the center of the zoomed area
      const totalRange = depthMax - depthMin;
      const centerDepth = (depthMinSel + depthMaxSel) / 2;
      const thumbPosition = 15 + ((centerDepth - depthMin) / totalRange) * 535; // 535 is plot area height

      setZoomState({
        minDepth: depthMinSel,
        maxDepth: depthMaxSel,
        minDiam: null,
        maxDiam: null
      });

      // Update thumb position to reflect the zoom center
      setThumbTop(Math.max(15, Math.min(550, thumbPosition)));
    }
    setSelection({start: null, end: null});
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    // Zoom with mouse wheel disabled
  };

  const handleScrollChange = (position: number) => {
    if (!data || !data.plot_data) return;
    const { plot_data } = data;
    const depthMin = Math.min(...plot_data.depth);
    const depthMax = Math.max(...plot_data.depth);
    const totalRange = depthMax - depthMin;
    const visibleRange = (zoomState.maxDepth ?? depthMax) - (zoomState.minDepth ?? depthMin);
    const start = depthMin + (position / 100) * (totalRange - visibleRange);
    setZoomState({
      minDepth: start,
      maxDepth: start + visibleRange,
      minDiam: null,
      maxDiam: null
    });
  };

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const rect = mountRef.current?.getBoundingClientRect();
        if (!rect) return;
        const relativeY = e.clientY - rect.top;
        const newTop = Math.max(15, Math.min(550, relativeY - 25)); // 25 is half thumb height
        setThumbTop(newTop);
        const position = ((newTop - 15) / 535) * 100;
        handleScrollChange(position);
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, data, zoomState]);

  return (
    <div
      ref={mountRef}
      style={{ position: 'relative', width: showFingerReadings ? '920px' : '620px', height: '600px' }}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        width={showFingerReadings ? 900 : 600}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setSelection({start: null, end: null}); setTooltip(null); setCurrentDepth(null); setHorizontalLineY(null); }}
        style={{
          border: '3px solid #2F4F4F',
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(37, 99, 235, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        }}
      />
      {zoomState.minDepth && (
        <>
          <div
            style={{
              position: 'absolute',
              right: '0px',
              top: '0px',
              height: '550px',
              width: '20px',
              background: 'linear-gradient(to bottom, #f0f0f0, #e0e0e0)',
              border: '1px solid #ccc',
              borderRadius: '10px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '0px',
              top: `${thumbTop}px`,
              height: '50px',
              width: '20px',
              background: 'linear-gradient(to bottom, #666, #444)',
              borderRadius: '10px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              cursor: 'ns-resize',
              transition: 'background 0.2s'
            }}
            onMouseDown={handleThumbMouseDown}
            onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom, #777, #555)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to bottom, #666, #444)'}
          />
        </>
      )}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y - 10}px`,
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '5px',
            fontSize: '12px',
            pointerEvents: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 10
          }}
        >
          Depth: {tooltip.depth.toFixed(1)}<br/>
          Min: {tooltip.min.toFixed(2)}<br/>
          Max: {tooltip.max.toFixed(2)}<br/>
          Avg: {tooltip.avg.toFixed(2)}<br/>
          {tooltip.gr !== null ? `GR: ${tooltip.gr.toFixed(1)}` : 'GR: N/A'}<br/>
          {tooltip.temp !== null ? `Temp: ${tooltip.temp.toFixed(1)}` : 'Temp: N/A'}
        </div>
      )}
    </div>
  );
};


// Cross Section Plot Component
const CrossSectionPlot = ({ data, currentDepth }: { data: any, currentDepth: number | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!data || !data.raw_data || !currentDepth) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 400, 400);

    const depths = data.raw_data.depth;
    const rCurves = data.raw_data.r_curves;

    if (!depths || !Array.isArray(depths) || !rCurves || !Array.isArray(rCurves)) return;

    let index = 0;
    let minDiff = Math.abs(depths[0] - currentDepth);
    for (let i = 1; i < depths.length; i++) {
      const diff = Math.abs(depths[i] - currentDepth);
      if (diff < minDiff) {
        minDiff = diff;
        index = i;
      }
    }

    if (index >= rCurves.length) return;

    const r = rCurves[index];
    console.log('r:', r, 'num:', r ? r.length : 'undefined');
    if (!r || !Array.isArray(r) || r.length === 0) {
      ctx.fillStyle = 'black';
      ctx.font = '16px Arial';
      ctx.fillText('No cross-section data', 120, 200);
      return;
    }

    const num = r.length;
    const centerX = 200;
    const centerY = 200;

    const nominalCasingRadius = 3.5; // 7-inch diameter
    const maxR = r.filter(val => val !== null).reduce((max, val) => Math.max(max, val), -Infinity);
    if (maxR === 0) return;

    // Determine the radius for scaling to ensure everything fits
    const scaleRadius = Math.max(nominalCasingRadius, maxR);
    const scale = 180 / scaleRadius; // fit within 180 pixels

    // Draw fixed 7-inch casing circle
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, nominalCasingRadius * scale, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw points and lines
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const points: number[][] = [];
    for (let i = 0; i < num; i++) {
      const angle = (i / num) * 2 * Math.PI;
      const x = centerX + r[i] * scale * Math.cos(angle);
      const y = centerY + r[i] * scale * Math.sin(angle);
      points.push([x, y]);
    }

    // Draw lines
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    // Draw points
    ctx.fillStyle = 'red';
    for (const [x, y] of points) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

  }, [data, currentDepth]);

  return <canvas ref={canvasRef} width={400} height={400} style={{
    border: '3px solid #2F4F4F',
    borderRadius: '12px',
    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
  }} />;
};


// An array for menu items to keep the code clean.
const menuItems = [
  { name: "Multifinger Home", href: "/multifinger_caliper" },
  { name: "Decentralised Plots", href: "/multifinger_caliper/decentralised-plots" },
  { name: "Reports", href: "#" },
  { name: "Settings", href: "#" },
  { name: "Help", href: "#" },
];

export default function MultifingerCaliperPage() {
    const { state, setState } = useMultifingerCaliper();
    const pathname = usePathname();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processProgress, setProcessProgress] = useState(0);

    const {
        isLoading,
        fileInfo,
        error,
        fileLoaded,
        plotData,
        isProcessing,
        isProcessed,
        resetKey,
        currentDepth,
        useCustomScale,
        customMinDiam,
        customMaxDiam,
        isUncentralised,
        showFingerReadings,
        showCollars
    } = state;

    const updateState = (updates: any) => {
        setState(prev => ({ ...prev, ...updates }));
    };

   // Ref para el input de archivo oculto
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Función para manejar el cambio del toggle
     const handleToggleChange = async (checked: boolean) => {
         if (checked && !isUncentralised) {
             // Si se está activando el modo Desentralised, mostrar confirmación
             setShowConfirmDialog(true);
         } else {
             // Si se está desactivando, proceder normalmente
             updateState({ isUncentralised: checked });
             // Si ya hay datos procesados, reprocesar automáticamente
             // Cuando checked=true (Desentralised activado), usar datos originales (use_centralized=false)
             if (isProcessed && fileLoaded) {
                 await handleProcessData(undefined, !checked); // checked=true -> use_centralized=false
             }
         }
     };

     // Función para confirmar la activación del modo Desentralised
     const confirmUncentralised = async () => {
         setShowConfirmDialog(false);
         updateState({ isUncentralised: true });
         // Si ya hay datos procesados, reprocesar automáticamente
         if (isProcessed && fileLoaded) {
             await handleProcessData(undefined, false); // use_centralized=false
         }
     };

     // Función para cancelar la activación del modo Desentralised
     const cancelUncentralised = () => {
         setShowConfirmDialog(false);
     };

  // Función que se ejecuta al hacer clic en el botón "Load .LAS"
  const handleButtonClick = () => {
    // Simula un clic en el input de archivo
    fileInputRef.current?.click();
  };

  // Función que se ejecuta cuando el usuario selecciona un archivo
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Archivo seleccionado:", file.name);
      updateState({
        isLoading: true,
        fileInfo: null,
        error: null,
        plotData: null, // Reset plot data when loading new file
        useCustomScale: false, // Reset custom scale when loading new file
        customMinDiam: 4, // Reset to default values
        customMaxDiam: 10,
        isUncentralised: false, // Reset Desentralised toggle when loading new file
        showCollars: false // Reset Show Collars checkbox when loading new file
      });
      setUploadProgress(0);

      // Usar XMLHttpRequest para tener progreso real de subida
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            const uploadData = JSON.parse(xhr.responseText);
            console.log("Archivo subido exitosamente:", uploadData);
            setUploadProgress(100);

            // Paso 2: Procesar archivo desde R2 con progreso real
            await processFileFromR2(uploadData.file_key);

          } catch (err: any) {
            console.error("Error parsing upload response:", err);
            updateState({
              error: "Error al procesar la respuesta del servidor",
              fileLoaded: false,
              isLoading: false
            });
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            throw new Error(errorData.detail?.replace("ERROR: ", "") || "Error al subir archivo");
          } catch {
            throw new Error("Error al subir archivo");
          }
        }
      };

      xhr.onerror = () => {
        console.error("Upload failed");
        updateState({
          error: "Error de conexión al subir el archivo",
          fileLoaded: false,
          isLoading: false
        });
      };

      xhr.ontimeout = () => {
        console.error("Upload timeout");
        updateState({
          error: "Timeout al subir el archivo (demasiado grande)",
          fileLoaded: false,
          isLoading: false
        });
      };

      // Configurar la petición
      xhr.open("POST", "https://studio-2lx4.onrender.com/api/multifinger-caliper/upload-via-proxy");
      xhr.timeout = 900000; // 15 minutes

      // Crear FormData y enviar
      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    }
  };

  // Función para procesar archivo desde R2 con progreso real
  const processFileFromR2 = async (fileKey: string) => {
    try {
      console.log("Procesando archivo desde R2...");

      // Iniciar procesamiento
      const processResponse = await fetch("https://studio-2lx4.onrender.com/api/multifinger-caliper/process-from-r2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_key: fileKey,
          use_centralized: true
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.detail?.replace("ERROR: ", "") || "Error al iniciar procesamiento");
      }

      // Hacer polling al progreso mientras se procesa
      const pollProgress = async () => {
        try {
          const progressResponse = await fetch("https://studio-2lx4.onrender.com/api/multifinger-caliper/progress");
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            setProcessProgress(progressData.progress);

            if (progressData.progress >= 100) {
              // Procesamiento completo, obtener resultados
              await getProcessingResults(fileKey);
            } else if (progressData.progress >= 0) {
              // Continuar polling si está en progreso
              setTimeout(pollProgress, 1000); // Poll every second
            } else {
              // Error en procesamiento
              updateState({
                error: "Error durante el procesamiento del archivo",
                fileLoaded: false,
                isLoading: false
              });
            }
          } else {
            // Error al consultar progreso
            updateState({
              error: "Error al consultar el progreso del procesamiento",
              fileLoaded: false,
              isLoading: false
            });
          }
        } catch (err) {
          console.error("Error polling progress:", err);
          updateState({
            error: "Error de conexión al consultar progreso",
            fileLoaded: false,
            isLoading: false
          });
        }
      };

      // Iniciar polling
      setTimeout(pollProgress, 1000);

    } catch (err: any) {
      console.error("Error starting processing:", err);
      updateState({
        error: err.message || "Error al procesar el archivo",
        fileLoaded: false,
        isLoading: false
      });
    }
  };

  // Función para obtener los resultados del procesamiento
  const getProcessingResults = async (fileKey: string) => {
    try {
      console.log("Obteniendo resultados del procesamiento para file_key:", fileKey);

      const resultsResponse = await fetch(`https://studio-2lx4.onrender.com/api/multifinger-caliper/processing-results/${fileKey}`);

      if (!resultsResponse.ok) {
        throw new Error("Resultados no disponibles aún");
      }

      const data = await resultsResponse.json();
      console.log("Resultados obtenidos:", data);

      // Count number of fingers (R curves)
      const rCurves = data.curves_found.filter((curve: string) => curve.startsWith('R') && curve.length > 1 && /^\d+$/.test(curve.substring(1)));
      const numFingers = rCurves.length;

      updateState({
        fileInfo: `File processed: ${fileKey}. Points: ${data.point_count}. Format: ${data.point_format_id}. Well: ${data.well_name}. Number of fingers: ${numFingers}.`,
        fileLoaded: true,
        isProcessed: false,
        isLoading: false
      });

    } catch (err: any) {
      console.error("Error getting results:", err);
      updateState({
        error: "Error al obtener resultados del procesamiento",
        fileLoaded: false,
        isLoading: false
      });
    }
  };

  // Función para manejar el botón "Process Data" con progreso real
  const handleProcessData = async (event?: any, forceUseCentralized?: boolean) => {
    console.log("Procesando datos del caliper...");
    updateState({ isProcessing: true, error: null });
    setProcessProgress(0);

    try {
      // Usar el parámetro forzado si se proporciona, sino calcular del estado del toggle
      const useCentralized = forceUseCentralized !== undefined ? forceUseCentralized : !isUncentralised;

      // Iniciar procesamiento con el endpoint existente
      const response = await fetch("https://studio-2lx4.onrender.com/api/multifinger-caliper/process-caliper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ use_centralized: useCentralized }),
        signal: AbortSignal.timeout(900000), // 15 minutes timeout
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail && errorData.detail.startsWith("ERROR:")) {
          throw new Error(errorData.detail.replace("ERROR: ", ""));
        }
        throw new Error("Error al procesar los datos del caliper.");
      }

      const data = await response.json();
      console.log("Respuesta del procesamiento:", data);

      // Mostrar progreso completo
      setProcessProgress(100);

      updateState({ plotData: data, isProcessed: true });
      console.log("Datos del gráfico procesados correctamente");

    } catch (err: any) {
      console.error("Error al procesar datos:", err);
      updateState({
        error: err.message || "Error processing caliper data. Make sure you have uploaded a valid LAS file.",
        plotData: null
      });
    } finally {
      updateState({ isProcessing: false });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header/>
      <div className="flex flex-1">
        <aside className="w-64 bg-gray-50 border-r border-gray-200 p-5">
          <nav className="flex flex-col space-y-2">
            <p className="font-bold text-lg text-gray-800 mb-4">Menu</p>
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200 ${
                  pathname === item.href ? 'bg-blue-100 text-blue-800 font-bold' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6 flex flex-col">
          <div className="border-b border-gray-200 pb-5 mb-5">
            <h1 className="text-3xl font-bold text-gray-800">Multifinger Caliper</h1>
             <p className="text-lg text-gray-500 mt-2">Interpretation and Preview Page</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            {/* Input de archivo real, pero oculto */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".las,.gz" // Filtra para mostrar archivos .las y .gz
            />
            {/* Botón personalizado que activa el input oculto */}
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={handleButtonClick}
                disabled={isLoading || (fileLoaded && !isProcessed)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? "Reading..." : "Load .LAS"}
              </button>

              {/* Progress bar for upload */}
              {isLoading && uploadProgress > 0 && (
                <div className="w-full max-w-md">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            {/* Área para mostrar información del archivo o errores */}
            <div className="mt-4 text-center h-6">
              {fileInfo && <p className="text-green-600">{fileInfo}</p>}
              {error && <p className="text-red-600">{error}</p>}
            </div>

            {/* Botón Process Data - aparece solo cuando se ha cargado un archivo */}
            {fileLoaded && (
              <div className="w-full flex flex-col items-center mt-20 space-y-4">
                <button
                  onClick={handleProcessData}
                  disabled={isProcessing || isProcessed}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Process Data"}
                </button>

                {/* Progress bar for processing */}
                {isProcessing && processProgress > 0 && (
                  <div className="w-full max-w-md">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${processProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Processing data... {processProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Área para mostrar el gráfico y cross section */}
            {plotData && (
                <div className="w-full flex mt-8 relative" style={{ height: '650px', marginBottom: '100px' }}>
                    <div className="flex-1 flex flex-col items-center">
                        <div className="mb-4 flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => updateState({ resetKey: resetKey + 1 })}
                                    className="bg-blue-500 hover:bg-blue-200 text-white font-bold py-1 px-2 rounded"
                                    disabled={isProcessing}
                                >
                                    Reset Zoom
                                </button>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="desentralised-mode"
                                        checked={isUncentralised}
                                        onCheckedChange={handleToggleChange}
                                        disabled={isProcessing}
                                    />
                                    <Label
                                        htmlFor="desentralised-mode"
                                        className={`transition-colors duration-200 ${
                                            isUncentralised
                                                ? 'text-blue-600 font-semibold drop-shadow-sm'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        Desentralised
                                    </Label>
                                </div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={useCustomScale}
                                        onChange={e => updateState({ useCustomScale: e.target.checked })}
                                        disabled={isProcessing}
                                    />
                                    Custom Caliper Scale
                                </label>
                                {useCustomScale && (
                                    <>
                                        <input
                                            type="number"
                                            placeholder="Min diámetro"
                                            value={customMinDiam}
                                            onChange={e => updateState({ customMinDiam: Number(e.target.value) })}
                                            className="border p-1 w-24 text-sm"
                                            step="0.1"
                                            disabled={isProcessing}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max diámetro"
                                            value={customMaxDiam}
                                            onChange={e => updateState({ customMaxDiam: Number(e.target.value) })}
                                            className="border p-1 w-24 text-sm"
                                            step="0.1"
                                            disabled={isProcessing}
                                        />
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={showCollars}
                                        onChange={e => updateState({ showCollars: e.target.checked })}
                                        disabled={isProcessing}
                                    />
                                    Show Collars
                                </label>
                            </div>
                        </div>
                        <HTML5CanvasPlot
                            key={resetKey}
                            data={plotData}
                            setCurrentDepth={(depth) => updateState({ currentDepth: depth })}
                            useCustomScale={useCustomScale}
                            customMinDiam={customMinDiam}
                            customMaxDiam={customMaxDiam}
                            showCollars={showCollars}
                        />
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                        <div className="mb-5 pb-9">
                            <span className="text-x1 font-semibold">Cross Section</span>
                        </div>
                        <CrossSectionPlot data={plotData} currentDepth={currentDepth} />
                    </div>

                    {/* Overlay de carga cuando está procesando */}
                    {isProcessing && (
                        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                                <p className="text-xl font-semibold text-gray-700">Processing caliper data...</p>
                                <p className="text-sm text-gray-500">Please wait while we analyze the measurements</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>
        </main>
      </div>
      <Footer />

      {/* Confirmation Dialog for Uncentralised Mode */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Desentralised Mode</AlertDialogTitle>
            <AlertDialogDescription>
              Decentralised data correspond to the raw data from the LAS file and have not had the centralisation algorithm applied. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelUncentralised}>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUncentralised}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
