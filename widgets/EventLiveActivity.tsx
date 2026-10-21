import { HStack, Link, Spacer, Text, VStack, type ImageProps } from "@expo/ui/swift-ui";
import { accessibilityLabel, background, cornerRadius, font, foregroundStyle, frame, lineLimit, monospacedDigit, multilineTextAlignment, padding, resizable } from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity, type LiveActivityEnvironment } from "expo-widgets";
import type { LiveEvent } from "../utils/live-event-model";

export interface EventActivityProps {
  title: string;
  location: string;
  phase: "starting-soon" | "doors-open" | "ongoing";
  intervalStart: number;
  intervalEnd: number;
  qrImageURI: string;
  eventURL: string;
  ticketURL: string;
  isDemo: boolean;
  registrationStatus?: LiveEvent["registrationStatus"];
  logoURI?: string;
  markURI?: string;
  backgroundColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isDark: boolean;
}

const EventActivity = (props: EventActivityProps, environment: LiveActivityEnvironment) => {
  "widget";
  // Everything used by this isolated runtime must be declared here or passed as props.
  // SDK 58's widget globals overwrite SwiftUI Image with the React Native stub.
  // Emit the native ImageView node directly until that upstream collision is fixed.
  const WidgetImage = (imageProps: ImageProps) => ({ type: "ImageView", props: imageProps }) as unknown as React.JSX.Element;
  const accent = environment.isLuminanceReduced ? props.textColor : props.accentColor;
  const interval = { lower: new Date(props.intervalStart), upper: new Date(props.intervalEnd) };
  const registrationLabel = props.registrationStatus === "REGISTERED" ? "Påmeldt" : props.registrationStatus === "QUEUED" ? "Venteliste" : props.registrationStatus === "RESERVED" ? "Reservert" : null;
  const registrationColor = props.registrationStatus === "REGISTERED" ? accent : environment.isLuminanceReduced ? props.textColor : props.isDark ? "#FFCC80" : "#795300";
  const logo = props.logoURI
    ? <WidgetImage uiImage={props.logoURI} modifiers={[resizable(), frame({ width: 84, height: 22 })]} />
    : <Text modifiers={[font({ size: 15, weight: "bold" }), foregroundStyle(props.textColor)]}>ONLINE</Text>;
  const mark = props.markURI
    ? <WidgetImage uiImage={props.markURI} modifiers={[resizable(), frame({ width: 20, height: 20 })]} />
    : <Text modifiers={[font({ size: 16, weight: "bold" }), foregroundStyle("#FFFFFF")]}>O</Text>;
  const ticket = (
    <Link destination={props.ticketURL} modifiers={[accessibilityLabel(props.isDemo ? "Testbillett, QR-kode" : "Billett, QR-kode")]}>
      <WidgetImage uiImage={props.qrImageURI} modifiers={[
        resizable(), frame({ width: 96, height: 96 }),
        // Round the white card, keeping padding around the QR's existing quiet zone.
        padding({ all: 6 }), background("#FFFFFF"), cornerRadius(14),
      ]} />
    </Link>
  );
  const progress = { type: "OnlineEventProgressView", props: { start: props.intervalStart, end: props.intervalEnd, accent } } as unknown as React.JSX.Element;
  const time = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };
  const timing = props.phase === "ongoing" ? (
    <VStack spacing={8} modifiers={[frame({ maxWidth: 1000 })]}>
      <HStack spacing={8}>
        <Text modifiers={[font({ size: 12, weight: "medium" }), monospacedDigit(), foregroundStyle(props.mutedColor)]}>{time(props.intervalStart)}</Text>
        <Spacer />
        <Text modifiers={[font({ size: 12, weight: "medium" }), monospacedDigit(), foregroundStyle(props.mutedColor)]}>{time(props.intervalEnd)}</Text>
      </HStack>
      {progress}
    </VStack>
  ) : <Text timerInterval={interval} countsDown modifiers={[font({ size: 34, weight: "semibold", design: "rounded" }), monospacedDigit(), multilineTextAlignment("center"), foregroundStyle(accent), lineLimit(1), frame({ maxWidth: 1000 })]} />;
  const details = (
    <VStack alignment="leading" spacing={0} modifiers={[frame({ maxWidth: 1000, height: 108 })]}>
      <HStack spacing={8}>
        {logo}
        <Spacer />
        {registrationLabel && <Text modifiers={[font({ size: 10, weight: "medium" }), foregroundStyle(registrationColor), padding({ horizontal: 6, vertical: 3 }), background(props.isDark ? "#20282E" : "#E7EDF2"), cornerRadius(5), lineLimit(1)]}>{registrationLabel}</Text>}
      </HStack>
      <Spacer />
      {timing}
      <Spacer />
      <HStack spacing={8}>
        <Text modifiers={[font({ size: 12, weight: "medium" }), foregroundStyle(props.textColor), lineLimit(1), frame({ maxWidth: 1000, alignment: "leading" })]}>{props.title}</Text>
        <HStack spacing={4}>
          <WidgetImage systemName="mappin" modifiers={[font({ size: 11, weight: "medium" }), foregroundStyle(props.mutedColor)]} />
          <Text modifiers={[font({ size: 12, weight: "medium" }), foregroundStyle(props.textColor), lineLimit(1), multilineTextAlignment("trailing")]}>{props.location}</Text>
        </HStack>
      </HStack>
    </VStack>
  );
  return {
    banner: <HStack alignment="center" spacing={16} modifiers={[padding({ all: 16 }), background(props.backgroundColor)]}>{details}{ticket}</HStack>,
    bannerSmall: <VStack alignment="leading" spacing={6}>{logo}<Text timerInterval={interval} countsDown modifiers={[font({ size: 24, weight: "semibold" }), monospacedDigit()]} /><Text modifiers={[font({ size: 11 }), lineLimit(1)]}>{registrationLabel ? `${registrationLabel} · ${props.location}` : props.location}</Text></VStack>,
    compactLeading: mark,
    compactTrailing: <Text timerInterval={interval} countsDown modifiers={[font({ size: 12, weight: "semibold" }), monospacedDigit(), frame({ width: 52 }), foregroundStyle("#91CEF5")]} />,
    minimal: mark,
    expandedBottom: <HStack alignment="center" spacing={16} modifiers={[padding({ all: 12 }), background(props.backgroundColor)]}>{details}{ticket}</HStack>,
  };
};

export default createLiveActivity("OnlineEventActivity", EventActivity);
