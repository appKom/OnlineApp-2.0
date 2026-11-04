// Rendered by Expo Widgets' native node dispatcher. Use Apple's timed view so
// progress advances without JavaScript, including while the app is terminated.
private struct OnlineEventProgressView: View {
  let start: Date
  let end: Date
  let accentHex: String

  private var accent: Color {
    let value = UInt64(accentHex.trimmingCharacters(in: CharacterSet(charactersIn: "#")), radix: 16) ?? 0x91CEF5
    return Color(red: Double((value >> 16) & 0xff) / 255,
                 green: Double((value >> 8) & 0xff) / 255,
                 blue: Double(value & 0xff) / 255)
  }

  var body: some View {
    if start < end {
      SwiftUI.ProgressView(timerInterval: start...end, countsDown: false) {
        EmptyView()
      } currentValueLabel: {
        EmptyView()
      }
      .progressViewStyle(.linear)
      .tint(LinearGradient(colors: [accent.opacity(0.4), accent], startPoint: .leading, endPoint: .trailing))
      .frame(height: 4)
      .scaleEffect(x: 1, y: 2)
      .frame(height: 12)
      .accessibilityLabel("Arrangementsfremdrift")
    }
  }
}
