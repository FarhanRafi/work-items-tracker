namespace WorkItemsTracker.Tests;

[CollectionDefinition("DatabaseTests", DisableParallelization = true)]
public class DatabaseCollection : ICollectionFixture<CustomWebApplicationFactory>
{
}
