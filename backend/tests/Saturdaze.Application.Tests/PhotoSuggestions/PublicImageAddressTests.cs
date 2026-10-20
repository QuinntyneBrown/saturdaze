// Traces to: L2-157 AC2
using System.Net;
using FluentAssertions;
using Saturdaze.Application.Photos;
using Xunit;

namespace Saturdaze.Application.Tests.PhotoSuggestions;

public class PublicImageAddressTests
{
    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("0.0.0.0")]
    [InlineData("10.0.0.5")]
    [InlineData("172.16.3.4")]
    [InlineData("172.31.255.255")]
    [InlineData("192.168.1.1")]
    [InlineData("169.254.169.254")]
    [InlineData("100.64.0.1")]
    [InlineData("224.0.0.1")]
    [InlineData("255.255.255.255")]
    [InlineData("::1")]
    [InlineData("::")]
    [InlineData("fe80::1")]
    [InlineData("fc00::1")]
    [InlineData("fd12::1")]
    [InlineData("ff02::1")]
    [InlineData("::ffff:127.0.0.1")]
    [InlineData("::ffff:10.1.2.3")]
    [InlineData("64:ff9b::a00:1")]
    public void Private_loopback_link_local_and_metadata_addresses_are_not_public(string address)
    {
        PublicImageAddress.IsPublic(IPAddress.Parse(address)).Should().BeFalse();
    }

    [Theory]
    [InlineData("208.80.154.224")]
    [InlineData("172.32.0.1")]
    [InlineData("100.128.0.1")]
    [InlineData("2620:0:862:ed1a::1")]
    [InlineData("::ffff:8.8.8.8")]
    public void Routable_addresses_are_public(string address)
    {
        PublicImageAddress.IsPublic(IPAddress.Parse(address)).Should().BeTrue();
    }

    [Theory]
    [InlineData("http://upload.wikimedia.org/a.jpg")]
    [InlineData("https://localhost/a.jpg")]
    [InlineData("https://api.localhost/a.jpg")]
    [InlineData("https://printer.local/a.jpg")]
    [InlineData("https://127.0.0.1/a.jpg")]
    [InlineData("https://[::1]/a.jpg")]
    [InlineData("ftp://upload.wikimedia.org/a.jpg")]
    public void Addresses_that_are_not_https_or_point_at_a_blocked_host_are_not_candidates(string url)
    {
        PublicImageAddress.IsCandidate(new Uri(url)).Should().BeFalse();
    }

    [Theory]
    [InlineData("https://upload.wikimedia.org/a.jpg")]
    [InlineData("https://208.80.154.224/a.jpg")]
    public void Https_addresses_on_public_hosts_are_candidates(string url)
    {
        PublicImageAddress.IsCandidate(new Uri(url)).Should().BeTrue();
    }
}
