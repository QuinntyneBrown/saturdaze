using System.Net;
using System.Net.Sockets;

namespace Saturdaze.Application.Photos;

/// <summary>
/// The address rules for fetching a candidate image from the open web (L2-157 AC2): HTTPS
/// only, and never a host that is, or resolves to, a loopback, private, link-local,
/// carrier-grade NAT, multicast, reserved or cloud-metadata address.
/// </summary>
public static class PublicImageAddress
{
    /// <summary>True when the URL is worth resolving: HTTPS, with a host that is not a blocked literal.</summary>
    public static bool IsCandidate(Uri url)
    {
        if (!url.IsAbsoluteUri || url.Scheme != Uri.UriSchemeHttps) return false;
        var host = url.IdnHost;
        if (string.IsNullOrWhiteSpace(host)) return false;
        if (string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase)
            || host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase)
            || host.EndsWith(".local", StringComparison.OrdinalIgnoreCase))
            return false;
        return !IPAddress.TryParse(host, out var literal) || IsPublic(literal);
    }

    /// <summary>True when the address is routable on the public internet.</summary>
    public static bool IsPublic(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();

        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            var b = address.GetAddressBytes();
            return b[0] switch
            {
                0 or 10 or 127 => false,
                100 when b[1] >= 64 && b[1] <= 127 => false,
                169 when b[1] == 254 => false,
                172 when b[1] >= 16 && b[1] <= 31 => false,
                192 when b[1] == 168 => false,
                192 when b[1] == 0 && b[2] == 0 => false,
                198 when b[1] == 18 || b[1] == 19 => false,
                >= 224 => false,
                _ => true,
            };
        }

        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            if (IPAddress.IPv6Loopback.Equals(address) || IPAddress.IPv6Any.Equals(address)) return false;
            if (address.IsIPv6LinkLocal || address.IsIPv6SiteLocal || address.IsIPv6Multicast || address.IsIPv6UniqueLocal) return false;
            var b = address.GetAddressBytes();
            // 64:ff9b::/96 and 2002::/16 wrap IPv4 addresses; judge the inner address.
            if (b[0] == 0x20 && b[1] == 0x02) return IsPublic(new IPAddress(b[2..6]));
            if (b[0] == 0 && b[1] == 0x64 && b[2] == 0xff && b[3] == 0x9b) return IsPublic(new IPAddress(b[12..16]));
            return true;
        }

        return false;
    }
}
