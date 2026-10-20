// Traces to: L2-157
using FluentAssertions;
using Saturdaze.Application.PhotoSuggestions;
using Xunit;

namespace Saturdaze.Application.Tests.PhotoSuggestions;

public class PhotoSuggestionCandidateParserTests
{
    [Fact]
    public void Reads_the_array_out_of_prose_and_code_fences()
    {
        const string text = """
            Here is what I found:
            ```json
            [
              { "imageUrl": "https://a.example/1.jpg", "title": "One", "sourceName": "Commons", "sourceUrl": "https://a.example/p", "attribution": "Photo · A", "licence": "CC BY 4.0" },
              { "ImageUrl": "https://a.example/2.jpg", "attribution": "Photo · B", "license": "CC0" }
            ]
            ```
            Let me know if you want more.
            """;

        var candidates = PhotoSuggestionCandidateParser.Parse(text);

        candidates.Should().HaveCount(2);
        candidates[0].Should().Be(new PhotoSuggestionCandidate("https://a.example/1.jpg", "One", "Commons", "https://a.example/p", "Photo · A", "CC BY 4.0"));
        candidates[1].ImageUrl.Should().Be("https://a.example/2.jpg");
        candidates[1].Title.Should().Be("Photo");
        candidates[1].SourceName.Should().Be("The web");
        candidates[1].Licence.Should().Be("CC0", "the American spelling is accepted too");
    }

    [Fact]
    public void Drops_entries_without_an_image_or_an_attribution_and_tolerates_bad_answers()
    {
        PhotoSuggestionCandidateParser.Parse("""[{ "imageUrl": "https://a.example/1.jpg" }, { "attribution": "x" }, 5]""")
            .Should().BeEmpty();
        PhotoSuggestionCandidateParser.Parse("I could not find anything.").Should().BeEmpty();
        PhotoSuggestionCandidateParser.Parse("[not json").Should().BeEmpty();
        PhotoSuggestionCandidateParser.Parse("{ \"imageUrl\": \"x\" }").Should().BeEmpty();
        PhotoSuggestionCandidateParser.Parse(null).Should().BeEmpty();
        PhotoSuggestionCandidateParser.Parse("[]").Should().BeEmpty();
    }
}
