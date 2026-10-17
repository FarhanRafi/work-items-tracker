using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorkItemsTracker.Core.Entities;

namespace WorkItemsTracker.Infrastructure.Data.Configurations;

public class WorkItemConfiguration : IEntityTypeConfiguration<WorkItem>
{
    public void Configure(EntityTypeBuilder<WorkItem> builder)
    {
        builder.ToTable("WorkItems");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(w => w.Description)
            .HasMaxLength(4000);

        // Store enums as integers: safe against enum member renames in application code
        builder.Property(w => w.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(w => w.Priority)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(w => w.CreatedAtUtc)
            .IsRequired();

        builder.Property(w => w.DueDateUtc)
            .IsRequired(false);

        builder.Property(w => w.UpdatedAtUtc)
            .IsRequired(false);

        // Foreign key with cascading delete on owner removal
        builder.HasOne(w => w.Owner)
            .WithMany(u => u.WorkItems)
            .HasForeignKey(w => w.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Composite indexes optimizing user-scoped queries and filtering
        builder.HasIndex(w => new { w.OwnerId, w.Status });
        builder.HasIndex(w => new { w.OwnerId, w.CreatedAtUtc });
    }
}
